'use client';

import { Contact, Mail, Phone, User, CheckCircle2, Loader2 } from 'lucide-react';
import { ContactFom } from './server-booking';
import { Dispatch, SetStateAction, useEffect, useState, useRef } from 'react';
import { checkOrCreateUserSilent } from '@/app/actions/user-check';

// Semantic Theme Classes
const SECTION_CARD_CLASS = "p-5 bg-card text-card-foreground border border-border rounded-xl shadow-sm";
const INPUT_CLASS = "w-full h-10 px-3 pl-10 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";
const LABEL_CLASS = "block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5";
const HEADER_CLASS = "text-lg font-bold text-foreground mb-4 flex items-center gap-2";

interface ContactInfoSectionProps {
  contactForm: ContactFom;
  setContactForm: Dispatch<SetStateAction<ContactFom>>;
  viewMode: boolean;
}

export function ContactInfoSection({
  contactForm,
  setContactForm,
  viewMode
}: ContactInfoSectionProps) {
  // Status: idle -> checking -> verified
  const [userStatus, setUserStatus] = useState<'idle' | 'checking' | 'verified'>('idle');
  
  // 🛡️ LOCK: Track the last email we processed to prevents duplicate fires
  const lastCheckedEmail = useRef<string>('');

  const handleChange = (field: keyof ContactFom, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
    
    // Only reset status if they change the email (the unique identifier)
    if (field === 'email' && value !== lastCheckedEmail.current) {
      setUserStatus('idle');
    }
  };

  // SILENT BACKGROUND CHECK (Debounced & Locked)
  useEffect(() => {
    // 1. Validation Rules
    const isValidEmail = contactForm.email.includes('@') && contactForm.email.includes('.');
    const hasName = contactForm.name.length > 2;
    const hasPhone = contactForm.phone.length > 6;
    const isNewEmail = contactForm.email !== lastCheckedEmail.current;

    if (!viewMode && isValidEmail && hasName && hasPhone && isNewEmail && userStatus === 'idle') {
      
      // 2. Debounce: Wait 1.5s after typing stops before firing
      const timer = setTimeout(async () => {
        // Double check lock before firing
        if (contactForm.email === lastCheckedEmail.current) return;
        
        setUserStatus('checking');
        const currentEmailToTest = contactForm.email; 

        try {
          // 3. Fire Server Action
          const result = await checkOrCreateUserSilent(
            currentEmailToTest, 
            contactForm.name, 
            contactForm.phone
          );
          
          // 4. Handle Result
          if (result.userId) {
            setUserStatus('verified');
            lastCheckedEmail.current = currentEmailToTest; // ✅ LOCK IT
            console.log('Prospect verified:', result.userId);
          } else {
            setUserStatus('idle'); // Retry allowed if failed
          }
        } catch (error) {
          console.error("Silent Check Failed", error);
          setUserStatus('idle');
        }
      }, 1500); 

      return () => clearTimeout(timer);
    }
  }, [contactForm.email, contactForm.name, contactForm.phone, userStatus, viewMode]);

  return (
    <div className={SECTION_CARD_CLASS}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={HEADER_CLASS.replace('mb-4', 'mb-0')}>
          <Contact className="w-5 h-5 text-primary" />
          Contact Information
        </h2>
        
        {/* Status Indicators */}
        {userStatus === 'checking' && (
           <div className="flex items-center gap-1 text-xs text-muted-foreground animate-pulse">
             <Loader2 className="w-3 h-3 animate-spin" />
             <span>Verifying...</span>
           </div>
        )}
        {userStatus === 'verified' && (
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium animate-in fade-in">
            <CheckCircle2 className="w-3 h-3" />
            <span>Profile Ready</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label className={LABEL_CLASS}>Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              name="full_name"
              value={contactForm.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={INPUT_CLASS}
              placeholder="Driver / Primary Contact"
              disabled={viewMode}
              autoComplete="name"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className={LABEL_CLASS}>Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              name="email"
              value={contactForm.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={INPUT_CLASS}
              placeholder="receipts@example.com"
              disabled={viewMode}
              autoComplete="email"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className={LABEL_CLASS}>Phone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="tel"
              name="phone"
              value={contactForm.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={INPUT_CLASS}
              placeholder="(555) 123-4567"
              disabled={viewMode}
              autoComplete="tel"
            />
          </div>
        </div>
      </div>
    </div>
  );
}