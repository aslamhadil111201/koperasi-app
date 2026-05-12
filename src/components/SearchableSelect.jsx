import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  // When value changes from outside, update searchTerm if not open
  useEffect(() => {
    if (!isOpen) {
      const selectedOption = options.find(opt => opt.value === value);
      if (selectedOption) {
        setSearchTerm(selectedOption.label);
      } else {
        setSearchTerm('');
      }
    }
  }, [value, options, isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        // Reset search term to selected value if closed without selecting
        const selectedOption = options.find(opt => opt.value === value);
        if (selectedOption) {
          setSearchTerm(selectedOption.label);
        } else {
          setSearchTerm('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [value, options]);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    opt.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          className="form-control"
          placeholder={placeholder || 'Pilih...'}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (!e.target.value) onChange('');
          }}
          onFocus={() => setIsOpen(true)}
          style={{ paddingRight: '30px', cursor: 'text' }}
        />
        <ChevronDown 
          size={16} 
          style={{ 
            position: 'absolute', right: '10px', color: 'var(--color-text-muted)', 
            pointerEvents: 'none', transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s'
          }} 
        />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          marginTop: '4px', background: 'var(--color-surface)',
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)', maxHeight: '200px', overflowY: 'auto',
          zIndex: 99999
        }}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                onMouseDown={() => handleSelect(opt.value)} // use onMouseDown to fire before input onBlur
                style={{
                  padding: '8px 12px', cursor: 'pointer', fontSize: '0.875rem',
                  background: value === opt.value ? 'rgba(255, 77, 0, 0.1)' : 'transparent',
                  color: value === opt.value ? 'var(--color-primary)' : 'var(--color-text-main)',
                  borderBottom: '1px solid var(--color-border)'
                }}
                onMouseEnter={(e) => e.target.style.background = value === opt.value ? 'rgba(255, 77, 0, 0.15)' : 'var(--color-surface-hover)'}
                onMouseLeave={(e) => e.target.style.background = value === opt.value ? 'rgba(255, 77, 0, 0.1)' : 'transparent'}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div style={{ padding: '8px 12px', fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              Tidak ada hasil ditemukan
            </div>
          )}
        </div>
      )}

      {/* Hidden select to satisfy native required form validation if needed */}
      {required && (
        <select 
          value={value} 
          onChange={()=>{}} 
          required 
          style={{ opacity: 0, position: 'absolute', height: 0, width: 0, bottom: 0, pointerEvents: 'none' }}
        >
          <option value=""></option>
          {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      )}
    </div>
  );
};

export default SearchableSelect;
