import React, { useRef, useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DateInputProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

/**
 * 8자리 숫자(예: 19921204)를 연속 타이핑 시 자동으로 YYYY-MM-DD로 포맷팅해주는 스마트 날짜 입력기.
 * 달력 아이콘을 클릭하여 브라우저 기본 Date Picker로도 선택 가능합니다.
 */
export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  placeholder = '예: 19921204 또는 1992-12-04',
  className = 'form-input',
  style,
  disabled = false,
}) => {
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState<string>(value || '');

  useEffect(() => {
    setDisplayValue(value || '');
  }, [value]);

  // 숫자 및 구분자를 YYYY-MM-DD 형태로 정규화 포맷팅
  const formatToDateString = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (!digits) return '';

    if (digits.length <= 4) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    } else {
      return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatToDateString(raw);
    setDisplayValue(formatted);

    // 8자리(YYYY-MM-DD 10자) 완성이거나 빈 문자열일 때 상위로 전송
    if (formatted.length === 10 || formatted === '') {
      onChange(formatted);
    } else if (formatted.length === 8 && !formatted.includes('-')) {
      const full = formatToDateString(formatted);
      onChange(full);
    }
  };

  const handleBlur = () => {
    // 포커스 벗어날 때 만약 8자리 숫자가 완성되지 않은 불완전한 상태면 정리
    if (displayValue && displayValue.length < 10) {
      const digits = displayValue.replace(/\D/g, '');
      if (digits.length === 8) {
        const full = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
        setDisplayValue(full);
        onChange(full);
      }
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDisplayValue(val);
    onChange(val);
  };

  const openDatePicker = () => {
    if (hiddenDateInputRef.current) {
      try {
        if ('showPicker' in HTMLInputElement.prototype) {
          hiddenDateInputRef.current.showPicker();
        } else {
          hiddenDateInputRef.current.focus();
        }
      } catch {
        hiddenDateInputRef.current.focus();
      }
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', ...style }}>
      <input
        type="text"
        inputMode="numeric"
        className={className}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleTextChange}
        onBlur={handleBlur}
        disabled={disabled}
        maxLength={10}
        style={{
          width: '100%',
          paddingRight: '36px',
          fontVariantNumeric: 'tabular-nums',
        }}
      />

      {/* 달력 아이콘 버튼 */}
      <button
        type="button"
        onClick={openDatePicker}
        disabled={disabled}
        title="달력에서 날짜 선택"
        style={{
          position: 'absolute',
          right: '8px',
          background: 'none',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          opacity: disabled ? 0.5 : 0.8,
        }}
      >
        <CalendarIcon size={16} />
      </button>

      {/* 숨겨진 네이티브 Date Input (picker 트리거용) */}
      <input
        ref={hiddenDateInputRef}
        type="date"
        value={value || ''}
        onChange={handlePickerChange}
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
          opacity: 0,
          pointerEvents: 'none',
          border: 'none',
          padding: 0,
          margin: 0,
        }}
      />
    </div>
  );
};
