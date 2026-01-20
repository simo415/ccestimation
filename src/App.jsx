import React, { useState } from 'react'
import { calculateCosts, DEFAULTS } from './pricing'
import './styles.css'

function makeTopic(id, name){
  return { id, name, throughput: 1000, dataPerMsg: 1024, retentionDays: 7, consumers: 1 }
}

export default function App(){
  const [topics, setTopics] = useState([ makeTopic(1, 'topic-1') ])
  const [expanded, setExpanded] = useState({})
  const [clusterType, setClusterType] = useState('standard')
  // initialize overrides to the defaults for the selected cluster type
  const initialPlan = DEFAULTS[clusterType] || DEFAULTS.standard
  const [overrides, setOverrides] = useState({
    storagePerGB: initialPlan.storagePerGB,
    computePerMonth: initialPlan.computePerMonth,
    networkPerGB: initialPlan.networkPerGB,
  })
  const [showOverrides, setShowOverrides] = useState(false)
  const [showTopicCompute, setShowTopicCompute] = useState(true)

  function updateTopic(idx, field, value){
    setTopics(prev=>{
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
  }

  function addTopic(){
    setTopics(prev=>[...prev, makeTopic(prev.length+1, `topic-${prev.length+1}`)])
  }

  function removeTopic(idx){
    setTopics(prev=>prev.filter((_,i)=>i!==idx))
  }

  function toggleExpand(idx){
    setExpanded(prev=>({ ...prev, [idx]: !prev[idx] }))
  }

  const inputs = {
    topics: topics.map(t=>({
      throughput: Number(t.throughput)||0,
      dataPerMsg: Number(t.dataPerMsg)||0,
      retentionDays: Number(t.retentionDays)||0,
      name: t.name,
      consumers: Number(t.consumers)||0,
    })),
    clusterType,
  }

  const result = calculateCosts(inputs, overrides)

  return (
    <div className="container">
      <h1>Confluent Cost Calculator</h1>
      <div className="grid">
        <div className="card">
          <h2>Topics / Use cases</h2>

          {topics.map((t, idx)=> (
            <div key={t.id} className="topic-entry" style={{borderTop: idx? '1px solid #eee':'none', paddingTop: idx?8:0, marginTop: idx?8:0}}>
              <div className="topic-row">
                <input className="topic-name" value={t.name} onChange={e=>updateTopic(idx,'name',e.target.value)} placeholder={`topic-${idx+1}`} />

                <div className="topic-cell" title="Throughput (msgs/sec)">
                  <div className="topic-label">TPS</div>
                  <div className="topic-value">{Number(t.throughput).toLocaleString()}</div>
                </div>

                <div className="topic-cell" title="Avg message size (bytes)">
                  <div className="topic-label">Size (B)</div>
                  <div className="topic-value">{Number(t.dataPerMsg).toLocaleString()}</div>
                </div>

                <div className="topic-cell" title="Retention (days)">
                  <div className="topic-label">Retention (d)</div>
                  <div className="topic-value">{Number(t.retentionDays).toLocaleString()}</div>
                </div>

                    <div className="topic-cell" title="Consumers">
                      <div className="topic-label">Consumers</div>
                      <div className="topic-value">{Number(t.consumers).toLocaleString()}</div>
                    </div>

                <div className="topic-actions">
                  <button onClick={()=>toggleExpand(idx)}>{expanded[idx] ? 'Hide' : 'Edit'}</button>
                  <button onClick={()=>removeTopic(idx)} disabled={topics.length===1}>Remove</button>
                </div>
              </div>

              {expanded[idx] && (
            <div className="topic-details">
                  <label>Throughput (msgs/sec)</label>
                  <input type="number" value={t.throughput} onChange={e=>updateTopic(idx,'throughput',e.target.value)} />

                  <label>Avg message size (bytes)</label>
                  <input type="number" value={t.dataPerMsg} onChange={e=>updateTopic(idx,'dataPerMsg',e.target.value)} />

                  <label>Retention (days)</label>
                  <input type="number" value={t.retentionDays} onChange={e=>updateTopic(idx,'retentionDays',e.target.value)} />

                  <label>Number of consumers</label>
                  <input type="number" min={0} value={t.consumers} onChange={e=>updateTopic(idx,'consumers',e.target.value)} />
                </div>
              )}
            </div>
          ))}

          <div style={{marginTop:12, display:'flex', gap:8, alignItems:'center'}}>
            <button onClick={addTopic}>Add topic</button>
          </div>
          <div style={{marginTop:12}}>
            <button onClick={()=>setShowOverrides(s=>!s)} style={{marginBottom:8}}>{showOverrides ? 'Hide pricing overrides' : 'Show pricing overrides (optional)'}</button>
            {showOverrides && (
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                <label style={{fontSize:12}}>Storage $/GB/mo override (applies to selected cluster)</label>
                <input type="number" step="0.01" value={overrides.storagePerGB ?? ''} onChange={e=>setOverrides(o=>({...o, storagePerGB: e.target.value?Number(e.target.value):undefined}))} style={{width:160}} />

                <label style={{fontSize:12}}>Compute $/mo override</label>
                <input type="number" step="1" value={overrides.computePerMonth ?? ''} onChange={e=>setOverrides(o=>({...o, computePerMonth: e.target.value?Number(e.target.value):undefined}))} style={{width:160}} />

                <label style={{fontSize:12}}>Network $/GB override</label>
                <input type="number" step="0.01" value={overrides.networkPerGB ?? ''} onChange={e=>setOverrides(o=>({...o, networkPerGB: e.target.value?Number(e.target.value):undefined}))} style={{width:160}} />
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2>Results</h2>
          <div className="results-controls" style={{display:'flex', gap:12, alignItems:'center', marginBottom:12}}>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <label style={{display:'block', fontSize:12}}>Cluster type</label>
              <select value={clusterType} onChange={e=>{
                const val = e.target.value
                setClusterType(val)
                const plan = DEFAULTS[val] || DEFAULTS.standard
                setOverrides({ storagePerGB: plan.storagePerGB, computePerMonth: plan.computePerMonth, networkPerGB: plan.networkPerGB })
              }}>
                <option value="standard">Standard</option>
                <option value="enterprise">Enterprise</option>
                <option value="dedicated">Dedicated</option>
              </select>
            </div>

            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <label style={{fontSize:12, display:'flex', alignItems:'center', gap:6}}>
                <input type="checkbox" checked={showTopicCompute} onChange={e=>setShowTopicCompute(!!e.target.checked)} />
                <span>Include compute in per-topic breakdown</span>
              </label>
            </div>
          </div>

          <Summary result={result} showTopicCompute={showTopicCompute} />
        </div>
      </div>

      <footer>
        <small>Built for quick estimates. Not official Confluent pricing. Indicative figures sourced from <a href="https://www.confluent.io/confluent-cloud/pricing/?pillar=stream&clusters=general">Confluent</a>.</small>
      </footer>
    </div>
  )
}

function Summary({ result, showTopicCompute }){
  if(!result || !result.plan) return <div>No results</div>

  const p = result.plan
  // sum of per-topic totals and delta (added to totals in pricing.js)
  const sumPerTopic = result.totals?.sumPerTopicTotals ?? result.perTopic?.reduce((s,t)=>s+(t.totalTopicCost||0),0)
  const delta = (p.monthlyCost || 0) - (sumPerTopic || 0)
  const [expandedTopics, setExpandedTopics] = useState({})

  const toggleTopic = (i) => setExpandedTopics(prev=>({ ...prev, [i]: !prev[i] }))

  return (
    <div>
      <div style={{marginBottom:8}}>
        <strong>Cluster:</strong> {p.displayName}
      </div>

      <div style={{marginBottom:8}}>
        <strong>Total storage (GB):</strong> {result.totals.storageGB.toLocaleString(undefined,{maximumFractionDigits:2})}
      </div>

      <div className="result-block">
        <h3>Plan summary</h3>
        <div className="breakdown">
          <div className="result-row">
            <div className="result-label">Estimated monthly cost</div>
            <div className="result-value">${p.monthlyCost.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
          </div>
          <div className="result-row">
            <div className="result-label">Storage cost</div>
            <div className="result-value">${p.storageCost.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
          </div>
          <div className="result-row">
            <div className="result-label">Compute cost</div>
            <div className="result-value">${p.computeCost.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
          </div>
          <div className="result-row">
            <div className="result-label">Network cost (producer)</div>
            <div className="result-value">${p.networkProducerCost.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
          </div>
          <div className="result-row">
            <div className="result-label">Network cost (consumers total)</div>
            <div className="result-value">${p.networkConsumersCost.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
          </div>
        </div>
      </div>

      {/* Reconciliation warning if per-topic sums don't match plan total */}
      {Math.abs(delta) > 0.01 && (
        <div style={{marginTop:10, padding:8, border:'1px solid #f5c6cb', background:'#fff5f6', color:'#721c24', borderRadius:4}}>
          <strong>Note:</strong> Sum of per-topic totals (${sumPerTopic.toLocaleString(undefined,{maximumFractionDigits:2})}) does not equal plan monthly total (${p.monthlyCost.toLocaleString(undefined,{maximumFractionDigits:2})}).
          <div style={{fontSize:12, marginTop:6}}>Difference: ${delta.toLocaleString(undefined,{maximumFractionDigits:2})} (positive means plan &gt; per-topic sum)</div>
        </div>
      )}

      <div className="result-block">
        <h3>Per-topic breakdown</h3>
        {result.perTopic.map((t, i)=> (
          <div key={i} style={{borderTop:i? '1px dashed #eee':'none', paddingTop:i?8:0, marginTop:i?8:0}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div style={{display:'flex', gap:12, alignItems:'center'}}>
                <button onClick={()=>toggleTopic(i)} style={{padding:'4px 8px'}}>{expandedTopics[i] ? 'Hide' : 'Details'}</button>
                <strong>{t.name || `topic-${i+1}`}</strong>
              </div>
              {(() => {
                const computePart = showTopicCompute ? (t.computeCost || 0) : 0
                const displayTotal = (t.totalTopicCost || 0) - ((t.computeCost || 0) - computePart)
                return <div style={{fontWeight:600}}>${displayTotal.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
              })()}
            </div>

            {expandedTopics[i] && (
              <div className="topic-breakdown-grid" style={{marginTop:8}}>
                <div className="topic-volumes">
                  <div className="result-row"><div className="result-label">Storage (GB)</div><div className="result-value">{t.storageGB.toLocaleString(undefined,{maximumFractionDigits:2})}</div></div>
                  <div className="result-row"><div className="result-label">Producer network (GB/month)</div><div className="result-value">{t.monthlyProducerGB.toLocaleString(undefined,{maximumFractionDigits:2})}</div></div>
                  <div className="result-row"><div className="result-label">Consumers</div><div className="result-value">{t.consumers}</div></div>
                  <div className="result-row"><div className="result-label">Consumers total network (GB/month)</div><div className="result-value">{t.monthlyConsumerGB.toLocaleString(undefined,{maximumFractionDigits:2})}</div></div>
                </div>

                <div className="topic-costs">
                  <div className="result-row"><div className="result-label">Storage cost</div><div className="result-value">${t.storageCost.toLocaleString(undefined,{maximumFractionDigits:2})}</div></div>
                  <div className="result-row"><div className="result-label">Producer network cost</div><div className="result-value">${t.networkProducerCost.toLocaleString(undefined,{maximumFractionDigits:2})}</div></div>
                  {showTopicCompute && <div className="result-row"><div className="result-label">Compute cost</div><div className="result-value">${t.computeCost.toLocaleString(undefined,{maximumFractionDigits:2})}</div></div>}
                  <div className="result-row"><div className="result-label">Consumers total network cost</div><div className="result-value">${t.networkConsumersCost.toLocaleString(undefined,{maximumFractionDigits:2})}</div></div>
                  {t.consumers > 1 && <div className="result-row"><div className="result-label">Per-consumer network cost</div><div className="result-value">${t.perConsumerNetworkCost.toLocaleString(undefined,{maximumFractionDigits:2})}</div></div>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
