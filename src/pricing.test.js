import { describe, it, expect } from 'vitest'
import { calculateCosts } from './pricing'

describe('pricing', ()=>{
  it('calculates non-zero costs for non-zero input (multiple topics)', ()=>{
    const topics = [
      { throughput:1000, dataPerMsg:1000, retentionDays:7, name:'t1' },
      { throughput:500, dataPerMsg:2000, retentionDays:14, name:'t2' }
    ]
    const res = calculateCosts({ topics, clusterType: 'standard' })
    expect(res.plan.monthlyCost).toBeGreaterThan(0)
    expect(res.perTopic.length).toBe(2)
  })
})
