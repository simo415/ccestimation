// Pricing model for Confluent cluster types with per-cluster defaults.

// Assumptions:
// - Storage per topic = throughput * avgMsgSize * retentionDays * 86400 / (1024^3) * replication
// - Network: producer sends data once per day; each consumer reads that data (consumers per topic)
// - Compute is allocated proportionally to storage usage across topics for shared plans

export const DEFAULTS = {
  defaultReplication: 3,
  // Simple approach: per-GB storage, per-month compute, per-GB network
  standard: {
    storagePerGB: 0.08,
    computePerMonth: 385,
    networkPerGB: 0.05
  },
  enterprise: {
    storagePerGB: 0.08,
    computePerMonth: 895,
    networkPerGB: 0.05
  },
  dedicated: {
    storagePerGB: 0.08,
    computePerMonth: 3000,
    networkPerGB: 0.05
  }
}

export function calculateCosts(inputs, overrides = {}){
  // inputs: { topics: [{throughput, dataPerMsg, retentionDays, name, consumers}], clusterType }
  const topics = (inputs && inputs.topics) || []
  const clusterType = (inputs && inputs.clusterType) || 'standard'
  const replication = DEFAULTS.defaultReplication || 3

  // Per-topic calculations
  const perTopic = []
  let totalRawStorageGB = 0
  let totalStorageGB = 0
  let totalMonthlyProducerGB = 0
  let totalMonthlyConsumerGB = 0

  topics.forEach(t=>{
    const msgsPerSec = Number(t.throughput) || 0
    const avgBytes = Number(t.dataPerMsg) || 0
    const retentionDays = Number(t.retentionDays) || 0
    const consumers = Math.max(0, Number(t.consumers) || 0)

    const dailyBytes = msgsPerSec * avgBytes * 86400
    const retentionBytes = dailyBytes * retentionDays
    const rawStorageGB = retentionBytes / (1024**3)
    const storageGB = rawStorageGB * replication

    const monthlyProducerGB = (dailyBytes / (1024**3)) * 30
    const monthlyConsumerGB = monthlyProducerGB * consumers

    perTopic.push({
      name: t.name,
      throughput: msgsPerSec,
      dataPerMsg: avgBytes,
      retentionDays,
      consumers,
      rawStorageGB,
      storageGB,
      monthlyProducerGB,
      monthlyConsumerGB,
    })

    totalRawStorageGB += rawStorageGB
    totalStorageGB += storageGB
    totalMonthlyProducerGB += monthlyProducerGB
    totalMonthlyConsumerGB += monthlyConsumerGB
  })

  // Choose plan configuration
  // Start from plan defaults and apply any overrides (passed in second arg)
  const planCfgDefaults = DEFAULTS[clusterType] || DEFAULTS.standard
  const planCfg = { ...planCfgDefaults }
  // allow overrides to be passed via second parameter (overrides.storagePerGB, overrides.computePerMonth, overrides.networkPerGB)
  const ov = overrides || {}
  if (ov.storagePerGB !== undefined) planCfg.storagePerGB = ov.storagePerGB
  if (ov.computePerMonth !== undefined) planCfg.computePerMonth = ov.computePerMonth
  if (ov.networkPerGB !== undefined) planCfg.networkPerGB = ov.networkPerGB

  const networkRate = (planCfg.networkPerGB !== undefined) ? planCfg.networkPerGB : DEFAULTS.networkPerGB
  //const discount = planCfg.networkDiscount || 1.0
  const discount = 1.0

  // Compute costs per topic (allocate compute proportionally to storage)
  const perTopicCosts = perTopic.map(t => {
    const storageCost = t.storageGB * planCfg.storagePerGB
    const planCompute = planCfg.computePerMonth || 0
    const computeCost = totalStorageGB > 0 ? planCompute * (t.storageGB / totalStorageGB) : 0

    const networkProducerCost = t.monthlyProducerGB * networkRate * discount
    const networkConsumersCost = t.monthlyConsumerGB * networkRate * discount
    const perConsumerNetworkCost = t.consumers? (networkConsumersCost / t.consumers) : 0

    return {
      ...t,
      storageCost,
      computeCost,
      networkProducerCost,
      networkConsumersCost,
      perConsumerNetworkCost,
      totalTopicCost: storageCost + computeCost + networkProducerCost + networkConsumersCost,
    }
  })

  // Plan-level aggregation
  let planCompute = 0
  let planStorageCost = 0
  let planNetworkProducer = 0
  let planNetworkConsumers = 0

  perTopicCosts.forEach(t=>{
    planStorageCost += t.storageCost
    planNetworkProducer += t.networkProducerCost
    planNetworkConsumers += t.networkConsumersCost
    planCompute += t.computeCost
  })

  // No special-case node math: approximate dedicated with the same per-plan variables
  let planComputeExtra = 0
  let nodes = undefined

  const planMonthly = planStorageCost + planCompute + planComputeExtra + planNetworkProducer + planNetworkConsumers
  // Reconciliation: sum per-topic totals and provide delta for debugging
  const sumPerTopicTotals = perTopicCosts.reduce((s, t) => s + (t.totalTopicCost || 0), 0)
  const reconciliationDelta = planMonthly - sumPerTopicTotals

  return {
    plan: {
      displayName: clusterType.charAt(0).toUpperCase() + clusterType.slice(1),
      storageGB: totalStorageGB,
      storageCost: planStorageCost,
      computeCost: planCompute + planComputeExtra,
      networkCost: planNetworkProducer + planNetworkConsumers,
      networkProducerCost: planNetworkProducer,
      networkConsumersCost: planNetworkConsumers,
      monthlyCost: planMonthly,
      nodes,
    },
    perTopic: perTopicCosts,
    totals: {
      rawStorageGB: totalRawStorageGB,
      storageGB: totalStorageGB,
      monthlyProducerGB: totalMonthlyProducerGB,
      monthlyConsumerGB: totalMonthlyConsumerGB,
      // debugging fields to help detect mismatches between per-topic and plan-level totals
      sumPerTopicTotals,
      reconciliationDelta,
    }
  }
}
