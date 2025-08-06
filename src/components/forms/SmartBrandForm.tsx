/**
 * SmartBrandForm Component
 * 스마트한 브랜드 생성 폼 - 실시간 검증, 자동 완성, 진행률 표시
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  Circle, 
  Building2, 
  Code, 
  Globe, 
  Save,
  RotateCcw,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { ValidatedInput } from './ValidatedInput';
import { useBrandValidation } from '@/hooks/useBrandValidation';
import type { CreateBrandInput } from '@/types/brand';

interface SmartBrandFormProps {
  // 초기 데이터
  initialData?: Partial<CreateBrandInput>;
  
  // 이벤트 핸들러
  onSubmit: (data: CreateBrandInput) => Promise<void>;
  onCancel: () => void;
  
  // 상태
  isLoading?: boolean;
  
  // 커스터마이제이션
  showAdvancedOptions?: boolean;
  className?: string;
}

/**
 * 폼 스텝 정의
 */
const FORM_STEPS = [
  { id: 'name', label: '브랜드명', icon: Building2, description: '브랜드의 공식 명칭' },
  { id: 'code', label: '브랜드 코드', icon: Code, description: '시스템에서 사용할 고유 식별자' },
  { id: 'domain', label: '도메인', icon: Globe, description: '브랜드 전용 웹사이트 도메인' },
] as const;

/**
 * 스텝 상태 인디케이터 컴포넌트
 */
const StepIndicator: React.FC<{
  steps: typeof FORM_STEPS;
  currentStep: number;
  completedSteps: Set<number>;
}> = ({ steps, currentStep, completedSteps }) => {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.has(index);
        const isCurrent = currentStep === index;
        const IconComponent = step.icon;
        
        return (
          <React.Fragment key={step.id}>
            <motion.div
              className={`
                flex flex-col items-center space-y-2 min-w-0 flex-1
                ${isCurrent ? 'text-blue-600 dark:text-blue-400' : ''}
                ${isCompleted ? 'text-green-600 dark:text-green-400' : ''}
              `}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* 아이콘과 체크 표시 */}
              <div className={`
                relative w-12 h-12 rounded-full border-2 flex items-center justify-center
                transition-all duration-300 
                ${isCurrent 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                  : isCompleted 
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900'
                }
              `}>
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  </motion.div>
                ) : (
                  <IconComponent className={`w-5 h-5 ${
                    isCurrent ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
                  }`} />
                )}
              </div>
              
              {/* 스텝 정보 */}
              <div className="text-center min-w-0">
                <p className={`text-sm font-medium truncate ${
                  isCurrent ? 'text-blue-600 dark:text-blue-400' : 
                  isCompleted ? 'text-green-600 dark:text-green-400' : 
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {step.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {step.description}
                </p>
              </div>
            </motion.div>
            
            {/* 연결선 */}
            {index < steps.length - 1 && (
              <div className={`
                flex-shrink-0 h-px w-8 mx-2 transition-colors duration-300
                ${isCompleted && completedSteps.has(index + 1)
                  ? 'bg-green-300 dark:bg-green-600'
                  : isCompleted || (isCurrent && index < currentStep)
                  ? 'bg-blue-300 dark:bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-700'
                }
              `} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/**
 * SmartBrandForm 메인 컴포넌트
 */
export const SmartBrandForm: React.FC<SmartBrandFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  showAdvancedOptions = true,
  className = '',
}) => {
  // 폼 검증 훅 사용
  const {
    formData,
    updateField,
    validation,
    applySuggestion,
    resetForm,
  } = useBrandValidation(initialData);

  // 로컬 상태
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showPreview, setShowPreview] = useState(false);

  /**
   * 완료된 스텝 추적
   */
  useEffect(() => {
    const newCompletedSteps = new Set<number>();
    
    if (validation.name.isValid) newCompletedSteps.add(0);
    if (validation.code.isValid) newCompletedSteps.add(1);
    if (validation.domain.isValid) newCompletedSteps.add(2);
    
    setCompletedSteps(newCompletedSteps);
    
    // 자동으로 다음 스텝으로 이동 (옵션)
    if (currentStep === 0 && validation.name.isValid && !validation.code.isValid) {
      setCurrentStep(1);
    } else if (currentStep === 1 && validation.code.isValid && !validation.domain.isValid) {
      setCurrentStep(2);
    }
  }, [validation, currentStep]);

  /**
   * 제출 핸들러
   */
  const handleSubmit = useCallback(async () => {
    if (!validation.isFormValid) return;
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('브랜드 생성 오류:', error);
    }
  }, [validation.isFormValid, formData, onSubmit]);

  /**
   * 리셋 핸들러
   */
  const handleReset = useCallback(() => {
    resetForm();
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setShowPreview(false);
  }, [resetForm]);

  /**
   * 스텝 이동 핸들러
   */
  const goToStep = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex);
  }, []);

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Sparkles className="w-6 h-6 text-blue-500" />
          <CardTitle className="text-2xl font-bold">스마트 브랜드 생성</CardTitle>
        </div>
        <CardDescription className="text-base">
          AI 기반 검증과 자동 완성으로 브랜드를 빠르고 정확하게 생성하세요
        </CardDescription>
        
        {/* 전체 진행률 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">완성도</span>
            <span className="text-muted-foreground">
              {validation.completionPercentage.toFixed(0)}%
            </span>
          </div>
          <Progress value={validation.completionPercentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* 스텝 인디케이터 */}
        <StepIndicator
          steps={FORM_STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
        />

        {/* 폼 필드들 */}
        <div className="space-y-6">
          {/* 브랜드명 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ValidatedInput
              name="name"
              label="브랜드명"
              value={formData.name}
              placeholder="예: 밀랍 (Millab)"
              required
              maxLength={255}
              validation={validation.name}
              onValueChange={(value) => updateField('name', value)}
              onSuggestionApply={(suggestion) => applySuggestion('code', suggestion)}
              showProgress
              showSuggestions
              aria-describedby="name-help"
            />
            <p id="name-help" className="text-xs text-muted-foreground mt-1">
              고객이 기억하기 쉬운 브랜드명을 입력하세요. 한글과 영문 모두 사용 가능합니다.
            </p>
          </motion.div>

          {/* 브랜드 코드 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ValidatedInput
              name="code"
              label="브랜드 코드"
              value={formData.code}
              placeholder="예: millab"
              required
              maxLength={50}
              validation={validation.code}
              onValueChange={(value) => updateField('code', value)}
              onSuggestionApply={(suggestion) => applySuggestion('domain', suggestion)}
              showProgress
              showSuggestions
              aria-describedby="code-help"
            />
            <p id="code-help" className="text-xs text-muted-foreground mt-1">
              시스템에서 사용할 고유 식별자입니다. 소문자, 숫자, 하이픈, 언더스코어만 사용 가능합니다.
            </p>
          </motion.div>

          {/* 도메인 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ValidatedInput
              name="domain"
              label="도메인"
              value={formData.domain}
              placeholder="예: millab.co.kr"
              required
              type="url"
              maxLength={255}
              validation={validation.domain}
              onValueChange={(value) => updateField('domain', value)}
              showProgress
              aria-describedby="domain-help"
            />
            <p id="domain-help" className="text-xs text-muted-foreground mt-1">
              브랜드 전용 웹사이트 도메인을 입력하세요. 향후 브랜드 분리 시 사용됩니다.
            </p>
          </motion.div>
        </div>

        {/* 고급 옵션 */}
        {showAdvancedOptions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Separator />
            <div className="space-y-4 pt-6">
              <h3 className="text-lg font-semibold">고급 설정</h3>
              
              {/* 활성 상태 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">브랜드 활성화</Label>
                  <p className="text-xs text-muted-foreground">
                    생성 즉시 브랜드를 활성화할지 선택하세요
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => updateField('is_active', checked)}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* 미리보기 섹션 */}
        <AnimatePresence>
          {showPreview && validation.isFormValid && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Separator />
              <div className="pt-6 space-y-4">
                <h3 className="text-lg font-semibold">미리보기</h3>
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">브랜드명:</span>
                        <p className="text-muted-foreground">{formData.name}</p>
                      </div>
                      <div>
                        <span className="font-medium">브랜드 코드:</span>
                        <p className="text-muted-foreground">{formData.code}</p>
                      </div>
                      <div>
                        <span className="font-medium">도메인:</span>
                        <p className="text-muted-foreground">{formData.domain}</p>
                      </div>
                      <div>
                        <span className="font-medium">상태:</span>
                        <Badge variant={formData.is_active ? 'default' : 'secondary'}>
                          {formData.is_active ? '활성' : '비활성'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 액션 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          {/* 미리보기 토글 */}
          {validation.isFormValid && (
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="order-3 sm:order-1"
            >
              {showPreview ? '미리보기 숨기기' : '미리보기 보기'}
            </Button>
          )}

          {/* 리셋 버튼 */}
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
            className="order-2 sm:order-2"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            리셋
          </Button>

          {/* 취소 버튼 */}
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
            className="order-4 sm:order-3"
          >
            취소
          </Button>

          {/* 생성 버튼 */}
          <Button
            onClick={handleSubmit}
            disabled={!validation.isFormValid || isLoading}
            className="order-1 sm:order-4 sm:ml-auto"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 mr-2"
                >
                  <Circle className="w-4 h-4" />
                </motion.div>
                생성 중...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                브랜드 생성
              </>
            )}
          </Button>
        </div>

        {/* 폼 유효성 경고 */}
        {!validation.isFormValid && validation.completionPercentage > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800"
          >
            <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              모든 필수 필드를 올바르게 입력해주세요. 
              현재 진행률: {validation.completionPercentage.toFixed(0)}%
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartBrandForm;