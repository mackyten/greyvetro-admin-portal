import { CSSProperties } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: CSSProperties;
}

export default function SearchInput({ value, onChange, placeholder = 'Search…', style }: SearchInputProps) {
  return (
    <div className="gv-search-wrap" style={style}>
      <span className="gv-search-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </span>
      <input
        className="gv-search-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
