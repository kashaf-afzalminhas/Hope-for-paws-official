import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Edit2, Loader2, Plus, ShieldCheck, Trash2, Truck, X } from 'lucide-react';

const API_URL = 'http://localhost:3000/api/sellers';
const getAxiosConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}` }
});

const guaranteeTypes = [
  ['QUALITY_GUARANTEE', 'Quality Guarantee'],
  ['SELLER_WARRANTY', 'Seller Warranty'],
  ['MANUFACTURER_WARRANTY', 'Manufacturer Warranty'],
  ['OTHER', 'Other']
];
const coverageModes = [
  ['NATIONWIDE', 'Nationwide'],
  ['SELECTED_AREAS', 'Selected cities / areas'],
  ['LOCAL_DELIVERY', 'Local delivery'],
  ['PICKUP', 'Pickup']
];
const emptyGuarantee = { type: 'QUALITY_GUARANTEE', customType: '', duration: '', durationUnit: 'days', description: '', isActive: true, isDefault: false };
const emptyShipping = {
  name: '', coverage: { mode: 'NATIONWIDE', areas: [] }, rates: [{ zone: 'LOCAL', fee: '' }, { zone: 'NATIONWIDE', fee: '' }], shippingFee: '', freeShippingThreshold: '',
  processingTime: { minDays: '', maxDays: '' }, transitTime: { minDays: '', maxDays: '' }, isActive: true, isDefault: false
};

function Status({ active }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{active ? 'Active' : 'Inactive'}</span>;
}

function PolicyForm({ kind, initial, onCancel, onSaved }) {
  const [form, setForm] = useState({ ...initial, ...(kind === 'shipping' && { rates: initial.rates?.length ? initial.rates : [{ zone: 'NATIONWIDE', fee: initial.shippingFee ?? '' }] }) });
  const [areasText, setAreasText] = useState((initial.coverage?.areas || []).join(', '));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isGuarantee = kind === 'guarantee';

  const update = (name, value) => setForm(prev => ({ ...prev, [name]: value }));
  const updateNested = (group, name, value) => setForm(prev => ({ ...prev, [group]: { ...prev[group], [name]: value } }));
  const updateRate = (zone, value) => setForm(prev => ({ ...prev, rates: (prev.rates || []).map(rate => rate.zone === zone ? { ...rate, fee: value } : rate) }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = isGuarantee
        ? form
        : { ...form, rates: (form.rates || []).filter(rate => rate.fee !== '' && rate.fee !== null && rate.fee !== undefined), coverage: { ...form.coverage, areas: areasText.split(',').map(area => area.trim()).filter(Boolean) } };
      if (!isGuarantee && payload.coverage.mode === 'SELECTED_AREAS' && payload.coverage.areas.length === 0) {
        throw new Error('Add at least one selected city or area.');
      }
      const base = `${API_URL}/policies/${isGuarantee ? 'guarantees' : 'shipping'}`;
      const response = form._id
        ? await axios.put(`${base}/${form._id}`, payload, getAxiosConfig())
        : await axios.post(base, payload, getAxiosConfig());
      onSaved(response.data.policy || response.data);
    } catch (err) {
      setError(err.message === 'Add at least one selected city or area.' ? err.message : (err.response?.data?.message || 'Unable to save policy.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mb-6 rounded-2xl border border-[#e8dcc8] bg-[#fcfaf8] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#6b493d]">{form._id ? 'Edit' : 'Add'} {isGuarantee ? 'Guarantee' : 'Shipping'} Policy</h3>
        <button type="button" onClick={onCancel} aria-label="Close form" className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {isGuarantee ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">Guarantee type<select value={form.type} onChange={e => update('type', e.target.value)} className="mt-1 w-full rounded-lg border-gray-300">{guaranteeTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          {form.type === 'OTHER' && <label className="text-sm font-medium text-gray-700">Custom guarantee type<input required value={form.customType} onChange={e => update('customType', e.target.value)} placeholder="Replacement Guarantee" className="mt-1 w-full rounded-lg border-gray-300" /></label>}
          <label className="text-sm font-medium text-gray-700">Duration<input required type="number" min="0" value={form.duration} onChange={e => update('duration', e.target.value)} className="mt-1 w-full rounded-lg border-gray-300" /></label>
          <label className="text-sm font-medium text-gray-700">Duration unit<select value={form.durationUnit} onChange={e => update('durationUnit', e.target.value)} className="mt-1 w-full rounded-lg border-gray-300">{['days', 'weeks', 'months', 'years'].map(unit => <option key={unit}>{unit}</option>)}</select></label>
          <label className="text-sm font-medium text-gray-700 sm:col-span-2">Description / customer terms<textarea required minLength="10" value={form.description} onChange={e => update('description', e.target.value)} rows="3" className="mt-1 w-full rounded-lg border-gray-300" /><span className="mt-1 block text-xs font-normal text-gray-500">Explain what the customer receives and the conditions for making a claim.</span></label>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700 sm:col-span-2">Policy name<input required value={form.name} onChange={e => update('name', e.target.value)} className="mt-1 w-full rounded-lg border-gray-300" /></label>
          <label className="text-sm font-medium text-gray-700">Coverage<select value={form.coverage.mode} onChange={e => updateNested('coverage', 'mode', e.target.value)} className="mt-1 w-full rounded-lg border-gray-300">{coverageModes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          {form.coverage.mode === 'SELECTED_AREAS' && <label className="text-sm font-medium text-gray-700">Cities / areas<input required value={areasText} onChange={e => setAreasText(e.target.value)} placeholder="Lahore, Islamabad" className="mt-1 w-full rounded-lg border-gray-300" /></label>}
          <fieldset className="rounded-lg border border-gray-200 p-3 sm:col-span-2"><legend className="px-1 text-sm font-semibold text-gray-700">Flat shipping rates</legend><div className="grid gap-3 sm:grid-cols-3">{[['LOCAL', 'Same city / local'], ['NATIONWIDE', 'Nationwide / other cities'], ['PICKUP', 'Pickup']].map(([zone, label]) => <label key={zone} className="text-sm font-medium text-gray-700">{label}<input type="number" min="0" value={form.rates?.find(rate => rate.zone === zone)?.fee ?? ''} onChange={e => updateRate(zone, e.target.value)} className="mt-1 w-full rounded-lg border-gray-300" placeholder="Optional" /></label>)}</div><p className="mt-2 text-xs font-normal text-gray-500">Configure the zones you serve. Leave unused zones empty.</p></fieldset>
          <label className="text-sm font-medium text-gray-700">Free shipping above <span className="font-normal text-gray-400">(optional)</span><input type="number" min="0" value={form.freeShippingThreshold ?? ''} onChange={e => update('freeShippingThreshold', e.target.value)} className="mt-1 w-full rounded-lg border-gray-300" /></label>
          <fieldset className="rounded-lg border border-gray-200 p-3"><legend className="px-1 text-sm font-semibold text-gray-700">Processing days</legend><div className="grid grid-cols-2 gap-2"><input required type="number" min="0" placeholder="Minimum" value={form.processingTime.minDays} onChange={e => updateNested('processingTime', 'minDays', e.target.value)} className="rounded-lg border-gray-300" /><input required type="number" min="0" placeholder="Maximum" value={form.processingTime.maxDays} onChange={e => updateNested('processingTime', 'maxDays', e.target.value)} className="rounded-lg border-gray-300" /></div></fieldset>
          <fieldset className="rounded-lg border border-gray-200 p-3"><legend className="px-1 text-sm font-semibold text-gray-700">Transit days</legend><div className="grid grid-cols-2 gap-2"><input required type="number" min="0" placeholder="Minimum" value={form.transitTime.minDays} onChange={e => updateNested('transitTime', 'minDays', e.target.value)} className="rounded-lg border-gray-300" /><input required type="number" min="0" placeholder="Maximum" value={form.transitTime.maxDays} onChange={e => updateNested('transitTime', 'maxDays', e.target.value)} className="rounded-lg border-gray-300" /></div></fieldset>
        </div>
      )}
      <div className="mt-4 space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" checked={form.isActive} onChange={e => update('isActive', e.target.checked)} className="rounded border-gray-300 text-[#6b493d]" /> Active policy</label>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" checked={Boolean(form.isDefault)} onChange={e => update('isDefault', e.target.checked)} className="rounded border-gray-300 text-[#6b493d]" /> Make this my default policy for all products</label>
      </div>
      <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600">Cancel</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#6b493d] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Save policy</button></div>
    </form>
  );
}

export default function SellerPolicies() {
  const [tab, setTab] = useState('guarantee');
  const [guarantees, setGuarantees] = useState([]);
  const [shipping, setShipping] = useState([]);
  const [templates, setTemplates] = useState({ guarantees: [], shipping: [] });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [guaranteeResponse, shippingResponse, templateResponse] = await Promise.all([
        axios.get(`${API_URL}/policies/guarantees`, getAxiosConfig()),
        axios.get(`${API_URL}/policies/shipping`, getAxiosConfig()),
        axios.get(`${API_URL}/policies/templates`, getAxiosConfig())
      ]);
      setGuarantees(guaranteeResponse.data);
      setShipping(shippingResponse.data);
      setTemplates(templateResponse.data || { guarantees: [], shipping: [] });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load policies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  const current = tab === 'guarantee' ? guarantees : shipping;
  const endpoint = tab === 'guarantee' ? 'guarantees' : 'shipping';
  const save = (policy) => {
    setEditing(null);
    setError('');
    if (tab === 'guarantee') {
      setGuarantees(prev => policy._id
        ? prev.some(item => item._id === policy._id)
          ? prev.map(item => item._id === policy._id ? policy : item)
          : [policy, ...prev]
        : prev);
    } else {
      setShipping(prev => policy._id
        ? prev.some(item => item._id === policy._id)
          ? prev.map(item => item._id === policy._id ? policy : item)
          : [policy, ...prev]
        : prev);
    }
    load();
  };
  const toggle = async (policy) => { try { const response = await axios.put(`${API_URL}/policies/${endpoint}/${policy._id}`, { ...policy, isActive: !policy.isActive }, getAxiosConfig()); save(response.data); } catch (err) { setError(err.response?.data?.message || 'Unable to update policy.'); } };
  const remove = async (policy) => { if (!window.confirm('Delete this policy?')) return; try { await axios.delete(`${API_URL}/policies/${endpoint}/${policy._id}`, getAxiosConfig()); if (tab === 'guarantee') setGuarantees(prev => prev.filter(item => item._id !== policy._id)); else setShipping(prev => prev.filter(item => item._id !== policy._id)); } catch (err) { setError(err.response?.data?.message || 'Unable to delete policy.'); } };
  const guaranteeLabel = (policy) => policy.type === 'OTHER' ? policy.customType : guaranteeTypes.find(([value]) => value === policy.type)?.[1] || policy.type;
  const activeTemplates = tab === 'guarantee' ? templates.guarantees : templates.shipping;
  const useTemplate = (template) => setEditing({ ...template, ...(tab === 'shipping' && { rates: template.rates || [] }) });

  return <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
    <div className="flex flex-col gap-4 border-b border-gray-100 bg-[#fcfaf8] p-6 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-bold text-[#6b493d]">Policies</h2><p className="mt-1 text-sm text-gray-500">Manage reusable guarantees and shipping information for your products.</p></div><div className="flex rounded-lg border border-[#e8dcc8] bg-white p-1">{[['guarantee', 'Guarantee Policies', ShieldCheck], ['shipping', 'Shipping Policies', Truck]].map(([value, label, Icon]) => <button key={value} onClick={() => { setTab(value); setEditing(null); }} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${tab === value ? 'bg-[#6b493d] text-white' : 'text-gray-500 hover:text-[#6b493d]'}`}><Icon className="h-4 w-4" />{label}</button>)}</div></div>
    <div className="p-6">{error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}{loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#6b493d]" /></div> : <>{!editing && <button onClick={() => setEditing(tab === 'guarantee' ? emptyGuarantee : emptyShipping)} className="mb-5 inline-flex items-center gap-2 rounded-lg bg-[#6b493d] px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" />Add {tab === 'guarantee' ? 'Guarantee' : 'Shipping'} Policy</button>}{!editing && activeTemplates.length > 0 && <section className="mb-6"><h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">Default / Templates</h3><div className="grid gap-3 md:grid-cols-2">{activeTemplates.map(template => <div key={template.id} className="rounded-xl border border-dashed border-[#e8dcc8] bg-[#fcfaf8] p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="font-semibold text-gray-900">{tab === 'guarantee' ? guaranteeLabel(template) : template.name}</h4><p className="mt-1 text-xs text-gray-500">{tab === 'guarantee' ? `${template.duration} ${template.durationUnit} · ${template.description}` : `${(template.rates || []).map(rate => `${rate.zone}: Rs. ${rate.fee}`).join(' · ')} · Processing ${template.processingTime.minDays}-${template.processingTime.maxDays} days`}</p></div><span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-gray-500">Template</span></div><button onClick={() => useTemplate(template)} className="mt-3 rounded-lg border border-[#6b493d] px-3 py-1.5 text-xs font-semibold text-[#6b493d]">Use Template</button></div>)}</div></section>}{editing && <PolicyForm kind={tab} initial={editing} onCancel={() => setEditing(null)} onSaved={save} />}{current.length === 0 && !editing ? <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-14 text-center text-gray-500">No {tab === 'guarantee' ? 'guarantee' : 'shipping'} policies created yet.</div> : <div className="space-y-3"><h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">My Policies</h3>{current.map(policy => <div key={policy._id} className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-gray-900">{tab === 'guarantee' ? guaranteeLabel(policy) : policy.name}</h3><Status active={policy.isActive} /></div>{tab === 'guarantee' ? <p className="mt-1 text-sm text-gray-500">{policy.duration} {policy.durationUnit}{policy.description ? ` · ${policy.description}` : ''}</p> : <p className="mt-1 text-sm text-gray-500">{(policy.rates || []).map(rate => `${rate.zone}: Rs. ${rate.fee}`).join(' · ')} · Processing: {policy.processingTime.minDays}-{policy.processingTime.maxDays} days · Transit: {policy.transitTime.minDays}-{policy.transitTime.maxDays} days</p>}</div><div className="flex shrink-0 items-center gap-2"><button onClick={() => toggle(policy)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600">{policy.isActive ? 'Disable' : 'Enable'}</button><button onClick={() => setEditing(policy)} aria-label="Edit policy" className="rounded-lg p-2 text-[#6b493d] hover:bg-[#f8f4ed]"><Edit2 className="h-4 w-4" /></button><button onClick={() => remove(policy)} aria-label="Delete policy" className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></div>)}</div>}</>}</div>
  </div>;
}
