'use client';

import { useState, useEffect } from 'react';
import { publishScheduleV2 } from '@/app/actions/publish-schedule-v2';
import { createClient } from '@/utils/supabase/client';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Mail, Users, MapPin, Globe, User, Eye, Send, FileText, Loader2, Save, Trash2, History, CheckCircle2, XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface Props {
  weekStart: string; // YYYY-MM-DD
  employees: any[]; 
  hrConfig: any[]; 
}

export default function EmailSchedulerModal({ weekStart, employees, hrConfig }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'compose' | 'preview' | 'history'>('compose');
  
  // -- STATE: SCOPE --
  const [scope, setScope] = useState<'individual' | 'department' | 'location' | 'all'>('location');
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  
  // -- STATE: CONTENT --
  const [subject, setSubject] = useState(`Schedule for Week of {{week_start}}`);
  const [body, setBody] = useState(
    `<p>Hi {{staff_name}},</p>
     <p>Here is your schedule for the upcoming week:</p>
     {{schedule_summary}}
     <p>Please review and let us know if you have any conflicts.</p>
     <p>Thanks,<br/>Management</p>`
  );
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');

  // -- STATE: DATA --
  const [templates, setTemplates] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]); // New History Logs
  
  // Load templates & logs on open
  useEffect(() => {
    if (isOpen) {
       const loadData = async () => {
         const sb = createClient();
         const [tmplRes, logsRes] = await Promise.all([
            sb.from('email_templates').select('*').order('created_at', { ascending: false }),
            sb.from('email_logs').select('*').order('sent_at', { ascending: false }).limit(50)
         ]);
         
         if (tmplRes.data) setTemplates(tmplRes.data);
         if (logsRes.data) setLogs(logsRes.data);
       };
       loadData();
       setSelectedTargets([]); 
    }
  }, [isOpen]);

  // -- HELPERS --
  const handleToggleTarget = (id: string) => {
    if (selectedTargets.includes(id)) {
      setSelectedTargets(prev => prev.filter(x => x !== id));
    } else {
      setSelectedTargets(prev => [...prev, id]);
    }
  };

  const insertVariable = (variable: string) => {
    setBody(prev => prev + ` ${variable} `);
  };

  const getRecipientCount = () => {
    if (scope === 'all') return employees.length;
    if (scope === 'individual') return selectedTargets.length;
    if (scope === 'location') return employees.filter(e => selectedTargets.includes(e.location)).length;
    if (scope === 'department') return employees.filter(e => selectedTargets.includes(e.department)).length;
    return 0;
  };

  // -- HANDLERS --
  const handleSaveTemplate = async () => {
    const name = prompt("Name this template:");
    if (!name) return;
    const sb = createClient();
    const { error } = await sb.from('email_templates').insert({
      name, subject_template: subject, body_template: body
    });
    if (error) toast.error("Failed to save template");
    else {
      toast.success("Template Saved");
      const { data } = await sb.from('email_templates').select('*').order('created_at', { ascending: false });
      if (data) setTemplates(data);
    }
  };

  const handleApplyTemplate = (tId: string) => {
    const t = templates.find(x => x.id === tId);
    if (t) {
      setSubject(t.subject_template);
      setBody(t.body_template);
      toast.success(`Applied template: ${t.name}`);
    }
  };

  const handleDeleteTemplate = async (id: string, e: any) => {
    e.stopPropagation();
    if(!confirm("Delete template?")) return;
    const sb = createClient();
    await sb.from('email_templates').delete().eq('id', id);
    setTemplates(prev => prev.filter(t => t.id !== id));
  }

  const handleSend = async () => {
    if (getRecipientCount() === 0) {
      toast.error("Please select at least one recipient.");
      return;
    }
    if (!confirm(`Are you sure you want to send this email to ${getRecipientCount()} people?`)) return;

    setLoading(true);
    const result = await publishScheduleV2({
      scope,
      targetIds: selectedTargets,
      weekDate: weekStart,
      subject,
      body,
      cc,
      bcc
    });

    setLoading(false);
    if (result.success) {
      toast.success(result.message);
      // Refresh logs immediately
      const sb = createClient();
      const { data } = await sb.from('email_logs').select('*').order('sent_at', { ascending: false }).limit(50);
      if (data) setLogs(data);
      setStep('history'); // Switch to history tab to show success
    } else {
      toast.error("Sending failed: " + result.message);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:shadow-md transition-all">
        <Mail className="w-4 h-4" /> Email Schedule
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 bg-white dark:bg-zinc-950 overflow-hidden">
          
          {/* HEADER */}
          <DialogHeader className="p-4 border-b bg-zinc-50 dark:bg-zinc-900 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Send className="w-5 h-5 text-blue-600" /> 
              Schedule Communication Center
            </DialogTitle>
          </DialogHeader>

          {/* BODY (Split Layout) */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            {/* LEFT COLUMN: TARGETS & SETTINGS */}
            <div className="w-full md:w-[400px] p-4 border-r flex flex-col gap-6 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-y-auto">
              
              {/* 1. AUDIENCE */}
              <div className="space-y-3">
                 <Label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">1. Select Audience</Label>
                 <Tabs value={scope} onValueChange={(v: any) => { setScope(v); setSelectedTargets([]); }} className="w-full">
                    <TabsList className="grid grid-cols-4 w-full h-9">
                       <TabsTrigger value="location" className="text-xs">Loc</TabsTrigger>
                       <TabsTrigger value="department" className="text-xs">Dept</TabsTrigger>
                       <TabsTrigger value="individual" className="text-xs">User</TabsTrigger>
                       <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                    </TabsList>
                 </Tabs>

                 {/* TARGET PICKER LIST */}
                 {scope !== 'all' && (
                    <div className="p-2 border rounded-md bg-white dark:bg-black h-48 overflow-y-auto space-y-1 shadow-inner">
                       {scope === 'location' && hrConfig.map(loc => (
                          <div key={loc.name} className="flex items-center space-x-2 p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded">
                             <Checkbox id={loc.name} checked={selectedTargets.includes(loc.name)} onCheckedChange={() => handleToggleTarget(loc.name)} />
                             <label htmlFor={loc.name} className="text-sm font-medium cursor-pointer w-full">{loc.name}</label>
                          </div>
                       ))}
                       {scope === 'department' && Array.from(new Set(employees.map(e => e.department))).filter(Boolean).sort().map(dept => (
                          <div key={dept as string} className="flex items-center space-x-2 p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded">
                             <Checkbox id={dept as string} checked={selectedTargets.includes(dept as string)} onCheckedChange={() => handleToggleTarget(dept as string)} />
                             <label htmlFor={dept as string} className="text-sm font-medium cursor-pointer w-full">{dept as string}</label>
                          </div>
                       ))}
                       {scope === 'individual' && employees.map(emp => (
                          <div key={emp.id} className="flex items-center space-x-2 p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded">
                             <Checkbox id={emp.id} checked={selectedTargets.includes(emp.id)} onCheckedChange={() => handleToggleTarget(emp.id)} />
                             <label htmlFor={emp.id} className="text-sm font-medium cursor-pointer w-full truncate">{emp.full_name}</label>
                          </div>
                       ))}
                    </div>
                 )}
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Recipients:</span>
                    <Badge variant="secondary" className="font-mono">{getRecipientCount()}</Badge>
                 </div>
              </div>

              {/* 2. TEMPLATES */}
              <div className="space-y-3">
                 <Label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">2. Templates</Label>
                 <Select onValueChange={handleApplyTemplate}>
                    <SelectTrigger className="bg-white dark:bg-black"><SelectValue placeholder="Load a template..." /></SelectTrigger>
                    <SelectContent>
                       {templates.map(t => (
                         <div key={t.id} className="flex items-center justify-between px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer group">
                            <SelectItem value={t.id} className="flex-1">{t.name}</SelectItem>
                            <Trash2 size={14} className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => handleDeleteTemplate(t.id, e)} />
                         </div>
                       ))}
                    </SelectContent>
                 </Select>
                 <Button variant="outline" size="sm" onClick={handleSaveTemplate} className="w-full text-xs h-7">
                    <Save className="w-3 h-3 mr-2"/> Save Current as Template
                 </Button>
              </div>

              {/* 3. OPTIONS */}
              <div className="space-y-3">
                 <Label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">3. Options</Label>
                 <div className="grid gap-2">
                    <Input value={cc} onChange={e => setCc(e.target.value)} placeholder="CC (optional)" className="h-8 text-xs bg-white dark:bg-black" />
                    <Input value={bcc} onChange={e => setBcc(e.target.value)} placeholder="BCC (optional)" className="h-8 text-xs bg-white dark:bg-black" />
                 </div>
              </div>

            </div>

            {/* RIGHT COLUMN: EDITOR & PREVIEW & HISTORY */}
            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950">
               
               <Tabs value={step} onValueChange={(v: any) => setStep(v)} className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between px-4 py-2 border-b">
                     <TabsList>
                        <TabsTrigger value="compose" className="gap-2"><FileText className="w-4 h-4"/> Compose</TabsTrigger>
                        <TabsTrigger value="preview" className="gap-2"><Eye className="w-4 h-4"/> Preview</TabsTrigger>
                        <TabsTrigger value="history" className="gap-2"><History className="w-4 h-4"/> History</TabsTrigger>
                     </TabsList>
                  </div>

                  {/* COMPOSE TAB */}
                  <TabsContent value="compose" className="flex-1 p-6 space-y-4 overflow-y-auto data-[state=inactive]:hidden">
                     <div className="space-y-2">
                        <Label>Subject Line</Label>
                        <Input value={subject} onChange={e => setSubject(e.target.value)} className="font-medium" />
                     </div>
                     <div className="space-y-2 flex-1 flex flex-col min-h-0">
                        <div className="flex justify-between items-center">
                           <Label>Email Body (HTML Supported)</Label>
                           <div className="flex gap-1 flex-wrap justify-end">
                              {['{{staff_name}}', '{{total_hours}}', '{{week_start}}', '{{schedule_summary}}', '{{department}}', '{{location}}', '{{link_roster}}'].map(v => (
                                 <Badge key={v} variant="outline" className="cursor-pointer hover:bg-blue-50 text-[10px]" onClick={() => insertVariable(v)}>{v}</Badge>
                              ))}
                           </div>
                        </div>
                        <Textarea 
                           value={body} 
                           onChange={e => setBody(e.target.value)} 
                           className="flex-1 min-h-[400px] font-mono text-sm leading-relaxed p-4 resize-none"
                        />
                     </div>
                  </TabsContent>

                  {/* PREVIEW TAB */}
                  <TabsContent value="preview" className="flex-1 p-0 bg-zinc-100 dark:bg-zinc-900 overflow-y-auto flex items-start justify-center pt-8 data-[state=inactive]:hidden">
                     <div className="bg-white text-zinc-900 w-[90%] max-w-[650px] shadow-xl min-h-[500px] rounded-lg overflow-hidden border border-zinc-200">
                        {/* Fake Email Client Header */}
                        <div className="bg-zinc-50 border-b p-4 text-xs space-y-1">
                           <div className="flex gap-2"><span className="text-zinc-500 w-12 text-right">To:</span> <span className="font-mono">employee@example.com</span></div>
                           <div className="flex gap-2"><span className="text-zinc-500 w-12 text-right">Subject:</span> <span className="font-bold">{subject.replace('{{week_start}}', weekStart)}</span></div>
                        </div>
                        
                        {/* Content */}
                        <div className="p-8">
                           <div 
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ 
                                 __html: body
                                    .replace(/{{staff_name}}/g, 'Alex')
                                    .replace(/{{full_name}}/g, 'Alex Smith')
                                    .replace(/{{department}}/g, 'Guides')
                                    .replace(/{{location}}/g, 'Las Vegas')
                                    .replace(/{{week_start}}/g, weekStart)
                                    .replace(/{{total_hours}}/g, '38.5')
                                    .replace(/{{link_roster}}/g, '#')
                                    .replace(/{{schedule_summary}}/g, `
                                       <div style="margin: 15px 0; border-left: 3px solid #d97706; padding-left: 10px;">
                                          <div style="margin-bottom: 5px;"><strong>Monday, Jan 5th</strong>: 9:00 AM - 5:00 PM (Guide)</div>
                                          <div style="margin-bottom: 5px;"><strong>Tuesday, Jan 6th</strong>: 9:00 AM - 5:00 PM (Driver)</div>
                                       </div>
                                    `) 
                              }} 
                           />
                           <hr className="my-8 border-zinc-100" />
                           <p className="text-[10px] text-zinc-400 text-center">SunBuggy Portal Footer</p>
                        </div>
                     </div>
                  </TabsContent>

                  {/* HISTORY TAB */}
                  <TabsContent value="history" className="flex-1 p-0 overflow-y-auto data-[state=inactive]:hidden">
                     <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b sticky top-0">
                           <tr>
                              <th className="p-3">Status</th>
                              <th className="p-3">Recipient</th>
                              <th className="p-3">Subject</th>
                              <th className="p-3 text-right">Sent At</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y">
                           {logs.length === 0 ? (
                              <tr><td colSpan={4} className="p-8 text-center text-zinc-500">No email history found.</td></tr>
                           ) : logs.map(log => (
                              <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                                 <td className="p-3">
                                    {log.status === 'sent' ? (
                                       <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1"><CheckCircle2 size={10}/> Sent</Badge>
                                    ) : (
                                       <Badge variant="destructive" className="gap-1"><XCircle size={10}/> Failed</Badge>
                                    )}
                                 </td>
                                 <td className="p-3 font-medium">
                                    {log.recipient_name}
                                    <div className="text-zinc-400 font-normal">{log.recipient_email}</div>
                                 </td>
                                 <td className="p-3 text-zinc-600 truncate max-w-[200px]">{log.subject}</td>
                                 <td className="p-3 text-right text-zinc-500 font-mono">
                                    {format(parseISO(log.sent_at), 'MMM d, h:mm a')}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </TabsContent>
               </Tabs>
            </div>

          </div>

          {/* FOOTER */}
          <DialogFooter className="p-4 border-t bg-white dark:bg-zinc-950 shrink-0">
             <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
             {step !== 'history' && (
                <Button onClick={handleSend} disabled={loading} className="gap-2 min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white">
                   {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
                   {loading ? 'Sending...' : `Send to ${getRecipientCount()} People`}
                </Button>
             )}
          </DialogFooter>

        </DialogContent>
      </Dialog>
    </>
  );
}