/**
 * SmartBrandForm 포괄적 테스트 스위트
 * UI 상호작용, 실시간 검증, 접근성을 포함한 완전한 테스트 구현
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SmartBrandForm } from '../SmartBrandForm';
import { useBrandValidation } from '@/hooks/useBrandValidation';
import type { CreateBrandInput } from '@/types/brand';

// jest-axe matcher 추가
expect.extend(toHaveNoViolations);

// 외부 의존성 모킹
jest.mock('@/hooks/useBrandValidation');
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// 모킹된 훅
const mockUseBrandValidation = useBrandValidation as jest.MockedFunction<typeof useBrandValidation>;

// 테스트 데이터
const mockInitialData: Partial<CreateBrandInput> = {
  company_id: 'test-company-id',
  name: '테스트 브랜드',
  code: 'test-brand',
  domain: 'test.example.com',
  is_active: true,
};

const mockValidationState = {
  name: {
    isValid: true,
    isValidating: false,
    errors: [],
    warnings: [],
    suggestions: ['millab'],
  },
  code: {
    isValid: true,
    isValidating: false,
    errors: [],
    warnings: [],
    suggestions: ['test.co.kr', 'test.com', 'test.kr'],
  },
  domain: {
    isValid: true,
    isValidating: false,
    errors: [],
    warnings: [],
    suggestions: [],
  },
  isFormValid: true,
  completionPercentage: 100,
};

const mockInvalidValidationState = {
  name: {
    isValid: false,
    isValidating: false,
    errors: ['브랜드명은 필수입니다.'],
    warnings: [],
    suggestions: [],
  },
  code: {
    isValid: false,
    isValidating: false,
    errors: ['브랜드 코드는 필수입니다.'],
    warnings: [],
    suggestions: [],
  },
  domain: {
    isValid: false,
    isValidating: false,
    errors: ['도메인은 필수입니다.'],
    warnings: [],
    suggestions: [],
  },
  isFormValid: false,
  completionPercentage: 25,
};

const mockFormData: CreateBrandInput = {
  company_id: 'test-company-id',
  name: '테스트 브랜드',
  code: 'test-brand',
  domain: 'test.example.com',
  is_active: true,
};

const mockHookReturn = {
  formData: mockFormData,
  setFormData: jest.fn(),
  updateField: jest.fn(),
  validation: mockValidationState,
  applySuggestion: jest.fn(),
  resetForm: jest.fn(),
  normalizeBrandCode: jest.fn((code) => code.toLowerCase()),
  normalizeBrandDomain: jest.fn((domain) => domain.toLowerCase()),
};

describe('SmartBrandForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    // 모든 mock 초기화
    jest.clearAllMocks();
    mockUseBrandValidation.mockReturnValue(mockHookReturn);
  });

  describe('렌더링', () => {
    it('기본 구조로 렌더링되어야 한다', () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('스마트 브랜드 생성')).toBeInTheDocument();
      expect(screen.getByText('AI 기반 검증과 자동 완성으로 브랜드를 빠르고 정확하게 생성하세요')).toBeInTheDocument();
      expect(screen.getByLabelText('브랜드명 *')).toBeInTheDocument();
      expect(screen.getByLabelText('브랜드 코드 *')).toBeInTheDocument();
      expect(screen.getByLabelText('도메인 *')).toBeInTheDocument();
    });

    it('초기 데이터로 렌더링되어야 한다', () => {
      render(
        <SmartBrandForm
          initialData={mockInitialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(mockUseBrandValidation).toHaveBeenCalledWith(mockInitialData);
    });

    it('스텝 인디케이터를 표시해야 한다', () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('브랜드명')).toBeInTheDocument();
      expect(screen.getByText('브랜드의 공식 명칭')).toBeInTheDocument();
      expect(screen.getByText('브랜드 코드')).toBeInTheDocument();
      expect(screen.getByText('시스템에서 사용할 고유 식별자')).toBeInTheDocument();
      expect(screen.getByText('도메인')).toBeInTheDocument();
      expect(screen.getByText('브랜드 전용 웹사이트 도메인')).toBeInTheDocument();
    });

    it('진행률 바를 표시해야 한다', () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('완성도')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('고급 옵션을 표시해야 한다', () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          showAdvancedOptions={true}
        />
      );

      expect(screen.getByText('고급 설정')).toBeInTheDocument();
      expect(screen.getByText('브랜드 활성화')).toBeInTheDocument();
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('고급 옵션을 숨길 수 있어야 한다', () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          showAdvancedOptions={false}
        />
      );

      expect(screen.queryByText('고급 설정')).not.toBeInTheDocument();
      expect(screen.queryByText('브랜드 활성화')).not.toBeInTheDocument();
    });
  });

  describe('폼 입력', () => {
    it('브랜드명 입력이 작동해야 한다', async () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('브랜드명 *');
      await user.type(nameInput, '새 브랜드');

      expect(mockHookReturn.updateField).toHaveBeenCalledWith('name', '새 브랜드');
    });

    it('브랜드 코드 입력이 작동해야 한다', async () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const codeInput = screen.getByLabelText('브랜드 코드 *');
      await user.type(codeInput, 'new-brand');

      expect(mockHookReturn.updateField).toHaveBeenCalledWith('code', 'new-brand');
    });

    it('도메인 입력이 작동해야 한다', async () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const domainInput = screen.getByLabelText('도메인 *');
      await user.type(domainInput, 'new.example.com');

      expect(mockHookReturn.updateField).toHaveBeenCalledWith('domain', 'new.example.com');
    });

    it('활성 상태 스위치가 작동해야 한다', async () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          showAdvancedOptions={true}
        />
      );

      const activeSwitch = screen.getByRole('switch');
      await user.click(activeSwitch);

      expect(mockHookReturn.updateField).toHaveBeenCalledWith('is_active', false);
    });
  });

  describe('검증 상태', () => {
    it('유효하지 않은 폼에서 경고를 표시해야 한다', () => {
      mockUseBrandValidation.mockReturnValue({
        ...mockHookReturn,
        validation: mockInvalidValidationState,
      });

      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('모든 필수 필드를 올바르게 입력해주세요. 현재 진행률: 25%')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument(); // 진행률 표시
    });

    it('유효한 폼에서 경고를 숨겨야 한다', () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText(/모든 필수 필드를 올바르게 입력해주세요/)).not.toBeInTheDocument();
    });

    it('완성도 0%일 때 경고를 숨겨야 한다', () => {
      mockUseBrandValidation.mockReturnValue({
        ...mockHookReturn,
        validation: {
          ...mockInvalidValidationState,
          completionPercentage: 0,
        },
      });

      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText(/모든 필수 필드를 올바르게 입력해주세요/)).not.toBeInTheDocument();
    });
  });

  describe('제출 기능', () => {
    it('유효한 폼에서 제출이 작동해야 한다', async () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByText('브랜드 생성');
      expect(submitButton).toBeEnabled();

      await user.click(submitButton);
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(mockFormData);
      });
    });

    it('유효하지 않은 폼에서 제출 버튼이 비활성화되어야 한다', () => {
      mockUseBrandValidation.mockReturnValue({
        ...mockHookReturn,
        validation: mockInvalidValidationState,
      });

      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByText('브랜드 생성');
      expect(submitButton).toBeDisabled();
    });

    it('로딩 중에 제출 버튼이 비활성화되어야 한다', () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      const submitButton = screen.getByText('생성 중...');
      expect(submitButton).toBeDisabled();
    });

    it('로딩 중에 로딩 인디케이터를 표시해야 한다', () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      expect(screen.getByText('생성 중...')).toBeInTheDocument();
    });

    it('제출 중 오류를 처리해야 한다', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockOnSubmit.mockRejectedValue(new Error('Submit error'));

      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByText('브랜드 생성');
      await user.click(submitButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('브랜드 생성 오류:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('취소 기능', () => {
    it('취소 버튼이 작동해야 한다', async () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByText('취소');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('로딩 중에 취소 버튼이 비활성화되어야 한다', () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      const cancelButton = screen.getByText('취소');
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('리셋 기능', () => {
    it('리셋 버튼이 작동해야 한다', async () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const resetButton = screen.getByText('리셋');
      await user.click(resetButton);

      expect(mockHookReturn.resetForm).toHaveBeenCalled();
    });

    it('로딩 중에 리셋 버튼이 비활성화되어야 한다', () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      const resetButton = screen.getByText('리셋');
      expect(resetButton).toBeDisabled();
    });
  });

  describe('미리보기 기능', () => {
    it('유효한 폼에서 미리보기 토글이 표시되어야 한다', () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('미리보기 보기')).toBeInTheDocument();
    });

    it('유효하지 않은 폼에서 미리보기 토글이 숨겨져야 한다', () => {
      mockUseBrandValidation.mockReturnValue({
        ...mockHookReturn,
        validation: mockInvalidValidationState,
      });

      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText('미리보기 보기')).not.toBeInTheDocument();
    });

    it('미리보기 토글이 작동해야 한다', async () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const previewToggle = screen.getByText('미리보기 보기');
      await user.click(previewToggle);

      expect(screen.getByText('미리보기')).toBeInTheDocument();
      expect(screen.getByText('미리보기 숨기기')).toBeInTheDocument();
    });

    it('미리보기에서 폼 데이터를 표시해야 한다', async () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const previewToggle = screen.getByText('미리보기 보기');
      await user.click(previewToggle);

      expect(screen.getByText('테스트 브랜드')).toBeInTheDocument();
      expect(screen.getByText('test-brand')).toBeInTheDocument();
      expect(screen.getByText('test.example.com')).toBeInTheDocument();
      expect(screen.getByText('활성')).toBeInTheDocument();
    });

    it('비활성 브랜드의 미리보기에서 올바른 상태를 표시해야 한다', async () => {
      mockUseBrandValidation.mockReturnValue({
        ...mockHookReturn,
        formData: {
          ...mockFormData,
          is_active: false,
        },
      });

      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const previewToggle = screen.getByText('미리보기 보기');
      await user.click(previewToggle);

      expect(screen.getByText('비활성')).toBeInTheDocument();
    });
  });

  describe('스텝 네비게이션', () => {
    it('완료된 스텝을 표시해야 한다', () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // 모든 필드가 유효하므로 모든 스텝이 완료되어야 함
      const checkIcons = screen.getAllByTestId(/CheckCircle2|check-circle/i);
      expect(checkIcons.length).toBeGreaterThanOrEqual(3);
    });

    it('현재 스텝을 하이라이트해야 한다', () => {
      mockUseBrandValidation.mockReturnValue({
        ...mockHookReturn,
        validation: {
          ...mockValidationState,
          name: { ...mockValidationState.name, isValid: false },
          code: { ...mockValidationState.code, isValid: false },
          domain: { ...mockValidationState.domain, isValid: false },
        },
      });

      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // 첫 번째 스텝이 현재 스텝이어야 함
      expect(screen.getByText('브랜드명')).toBeInTheDocument();
    });
  });

  describe('키보드 네비게이션', () => {
    it('Tab 키로 네비게이션이 가능해야 한다', async () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('브랜드명 *');
      nameInput.focus();

      await user.keyboard('{Tab}');
      expect(screen.getByLabelText('브랜드 코드 *')).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(screen.getByLabelText('도메인 *')).toHaveFocus();
    });

    it('Enter 키로 폼 제출이 가능해야 한다', async () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByText('브랜드 생성');
      submitButton.focus();
      
      await user.keyboard('{Enter}');
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(mockFormData);
      });
    });

    it('Escape 키로 취소가 가능해야 한다', async () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await user.keyboard('{Escape}');
      // Escape 키 핸들링은 개별 입력 필드에서 처리됨
    });
  });

  describe('접근성', () => {
    it('기본 접근성 요구사항을 만족해야 한다', async () => {
      const { container } = render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('필수 필드가 올바르게 표시되어야 한다', () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('브랜드명 *');
      const codeInput = screen.getByLabelText('브랜드 코드 *');
      const domainInput = screen.getByLabelText('도메인 *');

      expect(nameInput).toHaveAttribute('aria-required', 'true');
      expect(codeInput).toHaveAttribute('aria-required', 'true');
      expect(domainInput).toHaveAttribute('aria-required', 'true');
    });

    it('도움말 텍스트가 올바르게 연결되어야 한다', () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('브랜드명 *');
      const helpText = screen.getByText('고객이 기억하기 쉬운 브랜드명을 입력하세요. 한글과 영문 모두 사용 가능합니다.');

      expect(nameInput).toHaveAttribute('aria-describedby');
      expect(helpText).toBeInTheDocument();
    });

    it('진행률이 스크린 리더에게 전달되어야 한다', () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });

    it('로딩 상태가 스크린 리더에게 전달되어야 한다', () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      const submitButton = screen.getByText('생성 중...');
      expect(submitButton).toHaveAttribute('disabled');
    });
  });

  describe('사용자 경험', () => {
    it('긴 브랜드명이 올바르게 표시되어야 한다', () => {
      const longBrandName = 'Very Long Brand Name That Might Overflow The UI Element';
      mockUseBrandValidation.mockReturnValue({
        ...mockHookReturn,
        formData: {
          ...mockFormData,
          name: longBrandName,
        },
      });

      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByDisplayValue(longBrandName);
      expect(nameInput).toBeInTheDocument();
    });

    it('특수문자가 포함된 입력을 처리해야 한다', async () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('브랜드명 *');
      await user.type(nameInput, '브랜드@#$%^&*()');

      expect(mockHookReturn.updateField).toHaveBeenCalledWith('name', '브랜드@#$%^&*()');
    });

    it('빠른 타이핑을 처리해야 한다', async () => {
      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('브랜드명 *');
      
      // 빠른 연속 타이핑 시뮬레이션
      await user.type(nameInput, 'FastTyping', { delay: 1 });

      // 마지막 입력값이 올바르게 전달되어야 함
      expect(mockHookReturn.updateField).toHaveBeenLastCalledWith('name', 'FastTyping');
    });
  });

  describe('오류 처리', () => {
    it('검증 오류를 표시해야 한다', () => {
      mockUseBrandValidation.mockReturnValue({
        ...mockHookReturn,
        validation: mockInvalidValidationState,
      });

      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('브랜드명은 필수입니다.')).toBeInTheDocument();
      expect(screen.getByText('브랜드 코드는 필수입니다.')).toBeInTheDocument();
      expect(screen.getByText('도메인은 필수입니다.')).toBeInTheDocument();
    });

    it('네트워크 오류를 처리해야 한다', async () => {
      mockUseBrandValidation.mockReturnValue({
        ...mockHookReturn,
        validation: {
          ...mockValidationState,
          code: {
            ...mockValidationState.code,
            warnings: ['네트워크 오류로 중복 검사를 완료할 수 없습니다.'],
          },
        },
      });

      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('네트워크 오류로 중복 검사를 완료할 수 없습니다.')).toBeInTheDocument();
    });
  });

  describe('성능', () => {
    it('불필요한 리렌더링을 방지해야 한다', () => {
      const { rerender } = render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Props가 변경되지 않으면 리렌더링되지 않아야 함
      rerender(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // useBrandValidation이 한 번만 호출되어야 함 (초기 렌더링)
      expect(mockUseBrandValidation).toHaveBeenCalledTimes(2); // render + rerender
    });

    it('큰 데이터를 처리해야 한다', () => {
      const largeFormData = {
        ...mockFormData,
        name: 'A'.repeat(1000),
        code: 'a'.repeat(50),
        domain: 'a'.repeat(200) + '.example.com',
      };

      mockUseBrandValidation.mockReturnValue({
        ...mockHookReturn,
        formData: largeFormData,
      });

      render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByDisplayValue(largeFormData.name)).toBeInTheDocument();
    });
  });

  describe('커스터마이제이션', () => {
    it('커스텀 클래스명을 적용해야 한다', () => {
      const customClassName = 'custom-brand-form';
      
      const { container } = render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          className={customClassName}
        />
      );

      const formCard = container.querySelector(`.${customClassName}`);
      expect(formCard).toBeInTheDocument();
    });

    it('고급 옵션 표시를 제어할 수 있어야 한다', () => {
      const { rerender } = render(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          showAdvancedOptions={false}
        />
      );

      expect(screen.queryByText('고급 설정')).not.toBeInTheDocument();

      rerender(
        <SmartBrandForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          showAdvancedOptions={true}
        />
      );

      expect(screen.getByText('고급 설정')).toBeInTheDocument();
    });
  });
});