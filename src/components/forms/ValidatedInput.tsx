/**
 * ValidatedInput Component
 * 실시간 검증과 시각적 피드백을 제공하는 인텔리전트 입력 컴포넌트
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Lightbulb,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { FieldValidationState } from '@/hooks/useBrandValidation';

interface ValidatedInputProps {
  // 기본 props
  name: string;
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  type?: 'text' | 'email' | 'url' | 'password';
  maxLength?: number;
  
  // 검증 관련
  validation: FieldValidationState;
  onValueChange: (value: string) => void;
  
  // 제안 기능
  onSuggestionApply?: (suggestion: string) => void;
  
  // 스타일링
  className?: string;
  showProgress?: boolean;
  showSuggestions?: boolean;
  
  // 접근성
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

/**
 * 검증 상태별 스타일 및 아이콘
 */
const getValidationStyle = (validation: FieldValidationState) => {
  if (validation.isValidating) {
    return {
      borderClass: 'border-yellow-300 dark:border-yellow-600',
      bgClass: 'bg-yellow-50 dark:bg-yellow-950/20',
      icon: <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />,
      iconBg: 'bg-yellow-100 dark:bg-yellow-900',
    };
  }

  if (!validation.isValid && validation.errors.length > 0) {
    return {
      borderClass: 'border-red-300 dark:border-red-600',
      bgClass: 'bg-red-50 dark:bg-red-950/20',
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      iconBg: 'bg-red-100 dark:bg-red-900',
    };
  }

  if (validation.isValid) {
    return {
      borderClass: 'border-green-300 dark:border-green-600',
      bgClass: 'bg-green-50 dark:bg-green-950/20',
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      iconBg: 'bg-green-100 dark:bg-green-900',
    };
  }

  return {
    borderClass: 'border-gray-300 dark:border-gray-600',
    bgClass: 'bg-white dark:bg-gray-950',
    icon: null,
    iconBg: '',
  };
};

/**
 * 진행률 바 컴포넌트
 */
const ProgressBar: React.FC<{ 
  value: string; 
  maxLength?: number; 
  isValid: boolean;
}> = ({ value, maxLength, isValid }) => {
  if (!maxLength) return null;
  
  const progress = Math.min((value.length / maxLength) * 100, 100);
  const progressColor = isValid 
    ? 'bg-green-500 dark:bg-green-400' 
    : progress > 80 
    ? 'bg-yellow-500 dark:bg-yellow-400'
    : 'bg-blue-500 dark:bg-blue-400';

  return (
    <div className="mt-2">
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
        <motion.div
          className={`h-1 rounded-full transition-colors ${progressColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{value.length} / {maxLength}</span>
        <span>{progress.toFixed(0)}%</span>
      </div>
    </div>
  );
};

/**
 * 제안 목록 컴포넌트
 */
const SuggestionList: React.FC<{
  suggestions: string[];
  onApply: (suggestion: string) => void;
  label: string;
}> = ({ suggestions, onApply, label }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="mt-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
      >
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {label} 제안
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={`${suggestion}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => onApply(suggestion)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onApply(suggestion);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`${suggestion} 제안 적용`}
              >
                {suggestion}
                <Copy className="h-3 w-3 ml-1 opacity-60" />
              </Badge>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * 오류/경고 메시지 컴포넌트
 */
const ValidationMessages: React.FC<{
  errors: string[];
  warnings: string[];
}> = ({ errors, warnings }) => {
  return (
    <AnimatePresence>
      {(errors.length > 0 || warnings.length > 0) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-2 space-y-1"
        >
          {/* 오류 메시지 */}
          {errors.map((error, index) => (
            <motion.div
              key={`error-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
            >
              <XCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          ))}
          
          {/* 경고 메시지 */}
          {warnings.map((warning, index) => (
            <motion.div
              key={`warning-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (errors.length + index) * 0.1 }}
              className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{warning}</span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * ValidatedInput 메인 컴포넌트
 */
export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  name,
  label,
  value,
  placeholder,
  required = false,
  disabled = false,
  type = 'text',
  maxLength,
  validation,
  onValueChange,
  onSuggestionApply,
  className = '',
  showProgress = true,
  showSuggestions = true,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const validationStyle = getValidationStyle(validation);
  const inputId = `validated-input-${name}`;
  const errorId = `${inputId}-error`;
  const suggestionId = `${inputId}-suggestions`;

  // 실제 input type 결정 (password의 경우 토글 가능)
  const actualInputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <motion.div
      className={`space-y-2 ${className}`}
      layout
      transition={{ duration: 0.2 }}
    >
      {/* 라벨 */}
      <div className="flex items-center justify-between">
        <Label 
          htmlFor={inputId}
          className={`text-sm font-medium ${required ? 'after:content-["*"] after:text-red-500 after:ml-1' : ''}`}
        >
          {label}
        </Label>
        
        {/* 검증 상태 표시 */}
        {validation.isValidating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400"
          >
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>검증 중...</span>
          </motion.div>
        )}
      </div>

      {/* 입력 필드 */}
      <div className="relative">
        <Input
          id={inputId}
          name={name}
          type={actualInputType}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            // Enter 키로 제안 선택 (첫 번째 제안 자동 적용)
            if (e.key === 'Enter' && validation.suggestions && validation.suggestions.length > 0 && onSuggestionApply) {
              e.preventDefault();
              onSuggestionApply(validation.suggestions[0]);
            }
            // Escape 키로 포커스 해제
            if (e.key === 'Escape') {
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={`
            transition-all duration-200
            ${validationStyle.borderClass}
            ${isFocused ? 'ring-2 ring-blue-500/20 dark:ring-blue-400/20' : ''}
            ${validation.icon ? 'pr-10' : ''}
            ${type === 'password' ? 'pr-20' : ''}
          `}
          aria-describedby={[ariaDescribedBy, errorId, suggestionId].filter(Boolean).join(' ')}
          aria-invalid={ariaInvalid ?? (validation.errors.length > 0)}
          aria-required={required}
          aria-live={validation.isValidating ? 'polite' : undefined}
          role={validation.suggestions && validation.suggestions.length > 0 ? 'combobox' : undefined}
          aria-expanded={validation.suggestions && validation.suggestions.length > 0 ? 'true' : undefined}
        />

        {/* 검증 상태 아이콘 */}
        {validation.icon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 
              ${type === 'password' ? 'right-12' : 'right-3'}
              w-8 h-8 rounded-full flex items-center justify-center
              ${validationStyle.iconBg}
            `}
          >
            {validation.icon}
          </motion.div>
        )}

        {/* 비밀번호 토글 버튼 */}
        {type === 'password' && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* 진행률 바 */}
      {showProgress && maxLength && (
        <ProgressBar 
          value={value} 
          maxLength={maxLength} 
          isValid={validation.isValid} 
        />
      )}

      {/* 제안 목록 */}
      {showSuggestions && onSuggestionApply && validation.suggestions && (
        <div id={suggestionId}>
          <SuggestionList
            suggestions={validation.suggestions}
            onApply={onSuggestionApply}
            label={label}
          />
        </div>
      )}

      {/* 검증 메시지 */}
      <div id={errorId}>
        <ValidationMessages
          errors={validation.errors}
          warnings={validation.warnings}
        />
      </div>
    </motion.div>
  );
};

export default ValidatedInput;