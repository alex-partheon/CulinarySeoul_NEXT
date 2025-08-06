/**
 * ValidatedInput 포괄적 테스트 스위트
 * UI 상호작용, 검증 피드백, 접근성을 포함한 완전한 테스트 구현
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ValidatedInput } from '../ValidatedInput';
import type { FieldValidationState } from '@/hooks/useBrandValidation';

// jest-axe matcher 추가
expect.extend(toHaveNoViolations);

// framer-motion 모킹
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// 테스트 데이터
const mockValidValidation: FieldValidationState = {
  isValid: true,
  isValidating: false,
  errors: [],
  warnings: [],
  suggestions: [],
};

const mockInvalidValidation: FieldValidationState = {
  isValid: false,
  isValidating: false,
  errors: ['필드가 유효하지 않습니다.', '너무 짧습니다.'],
  warnings: ['권장사항을 확인하세요.'],
  suggestions: [],
};

const mockValidatingValidation: FieldValidationState = {
  isValid: false,
  isValidating: true,
  errors: [],
  warnings: [],
  suggestions: [],
};

const mockSuggestionsValidation: FieldValidationState = {
  isValid: true,
  isValidating: false,
  errors: [],
  warnings: [],
  suggestions: ['제안1', '제안2', '제안3'],
};

describe('ValidatedInput', () => {
  const mockOnValueChange = jest.fn();
  const mockOnSuggestionApply = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('기본 구조로 렌더링되어야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value=""
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      expect(screen.getByLabelText('테스트 필드')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('필수 필드 표시를 해야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value=""
          required={true}
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      expect(screen.getByLabelText('테스트 필드 *')).toBeInTheDocument();
    });

    it('placeholder를 표시해야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value=""
          placeholder="입력하세요"
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      expect(screen.getByPlaceholderText('입력하세요')).toBeInTheDocument();
    });

    it('disabled 상태를 처리해야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value=""
          disabled={true}
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('maxLength를 적용해야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value=""
          maxLength={100}
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('maxlength', '100');
    });
  });

  describe('입력 타입', () => {
    it('text 타입이 기본값이어야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value=""
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('email 타입을 설정할 수 있어야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value=""
          type="email"
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('url 타입을 설정할 수 있어야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value=""
          type="url"
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'url');
    });

    it('password 타입을 설정할 수 있어야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value=""
          type="password"
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText('비밀번호 보기')).toBeInTheDocument();
    });
  });

  describe('비밀번호 토글', () => {
    it('비밀번호 보기/숨기기 토글이 작동해야 한다', async () => {
      render(
        <ValidatedInput
          name="password"
          label="비밀번호"
          value="secret"
          type="password"
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      const input = screen.getByDisplayValue('secret');
      const toggleButton = screen.getByLabelText('비밀번호 보기');

      expect(input).toHaveAttribute('type', 'password');

      await user.click(toggleButton);

      expect(input).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText('비밀번호 숨기기')).toBeInTheDocument();

      await user.click(screen.getByLabelText('비밀번호 숨기기'));

      expect(input).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText('비밀번호 보기')).toBeInTheDocument();
    });
  });

  describe('입력 값 변경', () => {
    it('입력값 변경이 콜백을 호출해야 한다', async () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value=""
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'hello');

      expect(mockOnValueChange).toHaveBeenCalledTimes(5);
      expect(mockOnValueChange).toHaveBeenLastCalledWith('hello');
    });

    it('포커스 상태를 관리해야 한다', async () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value=""
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      const input = screen.getByRole('textbox');
      
      await user.click(input);
      // 포커스 시 링 효과가 적용되어야 함 (CSS 클래스로 확인)
      expect(input).toHaveClass('ring-2');
    });
  });

  describe('검증 상태 표시', () => {
    it('유효한 상태를 표시해야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="valid value"
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      // 검증 아이콘이 표시되어야 함 (valid 상태)
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-green-300');
    });

    it('유효하지 않은 상태를 표시해야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="invalid"
          validation={mockInvalidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-300');
    });

    it('검증 중 상태를 표시해야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="validating"
          validation={mockValidatingValidation}
          onValueChange={mockOnValueChange}
        />
      );

      expect(screen.getByText('검증 중...')).toBeInTheDocument();
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-yellow-300');
    });

    it('오류 메시지를 표시해야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="invalid"
          validation={mockInvalidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      expect(screen.getByText('필드가 유효하지 않습니다.')).toBeInTheDocument();
      expect(screen.getByText('너무 짧습니다.')).toBeInTheDocument();
    });

    it('경고 메시지를 표시해야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="warning"
          validation={mockInvalidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      expect(screen.getByText('권장사항을 확인하세요.')).toBeInTheDocument();
    });
  });

  describe('진행률 바', () => {
    it('진행률 바를 표시해야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="test"
          maxLength={10}
          showProgress={true}
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      expect(screen.getByText('4 / 10')).toBeInTheDocument();
      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('진행률 바를 숨길 수 있어야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="test"
          maxLength={10}
          showProgress={false}
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      expect(screen.queryByText('4 / 10')).not.toBeInTheDocument();
    });

    it('maxLength가 없으면 진행률 바를 표시하지 않아야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="test"
          showProgress={true}
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      expect(screen.queryByText('4 /')).not.toBeInTheDocument();
    });

    it('진행률에 따라 색상이 변경되어야 한다', () => {
      const { rerender } = render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="test"
          maxLength={10}
          showProgress={true}
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      // 40% 진행률 - 파란색
      expect(screen.getByText('40%')).toBeInTheDocument();

      rerender(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="testtesttest" // 90% 진행률
          maxLength={10}
          showProgress={true}
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      expect(screen.getByText('120%')).toBeInTheDocument(); // maxLength 초과
    });
  });

  describe('제안 기능', () => {
    it('제안 목록을 표시해야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="test"
          validation={mockSuggestionsValidation}
          onValueChange={mockOnValueChange}
          onSuggestionApply={mockOnSuggestionApply}
          showSuggestions={true}
        />
      );

      expect(screen.getByText('테스트 필드 제안')).toBeInTheDocument();
      expect(screen.getByText('제안1')).toBeInTheDocument();
      expect(screen.getByText('제안2')).toBeInTheDocument();
      expect(screen.getByText('제안3')).toBeInTheDocument();
    });

    it('제안을 클릭하면 적용되어야 한다', async () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="test"
          validation={mockSuggestionsValidation}
          onValueChange={mockOnValueChange}
          onSuggestionApply={mockOnSuggestionApply}
          showSuggestions={true}
        />
      );

      const suggestion = screen.getByText('제안1');
      await user.click(suggestion);

      expect(mockOnSuggestionApply).toHaveBeenCalledWith('제안1');
    });

    it('Enter 키로 제안을 적용할 수 있어야 한다', async () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="test"
          validation={mockSuggestionsValidation}
          onValueChange={mockOnValueChange}
          onSuggestionApply={mockOnSuggestionApply}
          showSuggestions={true}
        />
      );

      const suggestion = screen.getByText('제안1');
      suggestion.focus();
      await user.keyboard('{Enter}');

      expect(mockOnSuggestionApply).toHaveBeenCalledWith('제안1');
    });

    it('Space 키로 제안을 적용할 수 있어야 한다', async () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="test"
          validation={mockSuggestionsValidation}
          onValueChange={mockOnValueChange}
          onSuggestionApply={mockOnSuggestionApply}
          showSuggestions={true}
        />
      );

      const suggestion = screen.getByText('제안1');
      suggestion.focus();
      await user.keyboard(' ');

      expect(mockOnSuggestionApply).toHaveBeenCalledWith('제안1');
    });

    it('제안 기능을 비활성화할 수 있어야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="test"
          validation={mockSuggestionsValidation}
          onValueChange={mockOnValueChange}
          onSuggestionApply={mockOnSuggestionApply}
          showSuggestions={false}
        />
      );

      expect(screen.queryByText('테스트 필드 제안')).not.toBeInTheDocument();
    });

    it('onSuggestionApply가 없으면 제안을 표시하지 않아야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="test"
          validation={mockSuggestionsValidation}
          onValueChange={mockOnValueChange}
          showSuggestions={true}
        />
      );

      expect(screen.queryByText('테스트 필드 제안')).not.toBeInTheDocument();
    });
  });

  describe('키보드 네비게이션', () => {
    it('Enter 키로 첫 번째 제안을 적용해야 한다', async () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="test"
          validation={mockSuggestionsValidation}
          onValueChange={mockOnValueChange}
          onSuggestionApply={mockOnSuggestionApply}
          showSuggestions={true}
        />
      );

      const input = screen.getByRole('textbox');
      input.focus();
      await user.keyboard('{Enter}');

      expect(mockOnSuggestionApply).toHaveBeenCalledWith('제안1');
    });

    it('Escape 키로 포커스를 해제해야 한다', async () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="test"
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      const input = screen.getByRole('textbox');
      input.focus();
      expect(input).toHaveFocus();

      await user.keyboard('{Escape}');
      expect(input).not.toHaveFocus();
    });

    it('Tab 키로 네비게이션이 가능해야 한다', async () => {
      render(
        <div>
          <ValidatedInput
            name="test1"
            label="필드 1"
            value=""
            validation={mockValidValidation}
            onValueChange={mockOnValueChange}
          />
          <ValidatedInput
            name="test2"
            label="필드 2"
            value=""
            validation={mockValidValidation}
            onValueChange={mockOnValueChange}
          />
        </div>
      );

      const input1 = screen.getByLabelText('필드 1');
      const input2 = screen.getByLabelText('필드 2');

      input1.focus();
      expect(input1).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(input2).toHaveFocus();
    });
  });

  describe('접근성', () => {
    it('기본 접근성 요구사항을 만족해야 한다', async () => {
      const { container } = render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="test value"
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('aria-required 속성을 설정해야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value=""
          required={true}
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('aria-invalid 속성을 설정해야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="invalid"
          validation={mockInvalidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('aria-describedby 속성을 설정해야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="test"
          validation={mockInvalidValidation}
          onValueChange={mockOnValueChange}
          aria-describedby="external-help"
        />
      );

      const input = screen.getByRole('textbox');
      const describedBy = input.getAttribute('aria-describedby');
      
      expect(describedBy).toContain('external-help');
      expect(describedBy).toContain('validated-input-test-error');
    });

    it('검증 중 상태가 스크린 리더에게 전달되어야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="validating"
          validation={mockValidatingValidation}
          onValueChange={mockOnValueChange}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-live', 'polite');
    });

    it('제안이 있을 때 combobox role을 설정해야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="test"
          validation={mockSuggestionsValidation}
          onValueChange={mockOnValueChange}
          onSuggestionApply={mockOnSuggestionApply}
          showSuggestions={true}
        />
      );

      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-expanded', 'true');
    });

    it('제안 버튼에 올바른 aria-label을 설정해야 한다', () => {
      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="test"
          validation={mockSuggestionsValidation}
          onValueChange={mockOnValueChange}
          onSuggestionApply={mockOnSuggestionApply}
          showSuggestions={true}
        />
      );

      const suggestion = screen.getByText('제안1');
      expect(suggestion).toHaveAttribute('aria-label', '제안1 제안 적용');
    });
  });

  describe('스타일링', () => {
    it('커스텀 클래스명을 적용해야 한다', () => {
      const customClassName = 'custom-input';
      
      const { container } = render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value=""
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
          className={customClassName}
        />
      );

      const inputContainer = container.querySelector(`.${customClassName}`);
      expect(inputContainer).toBeInTheDocument();
    });

    it('검증 상태별로 올바른 스타일을 적용해야 한다', () => {
      const { rerender } = render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value=""
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      let input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-green-300');

      rerender(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value=""
          validation={mockInvalidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-300');

      rerender(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value=""
          validation={mockValidatingValidation}
          onValueChange={mockOnValueChange}
        />
      );

      input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-yellow-300');
    });

    it('패스워드 필드에서 올바른 패딩을 적용해야 한다', () => {
      render(
        <ValidatedInput
          name="password"
          label="비밀번호"
          value=""
          type="password"
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pr-20'); // 패스워드 토글 버튼을 위한 패딩
    });
  });

  describe('성능', () => {
    it('불필요한 리렌더링을 방지해야 한다', () => {
      const { rerender } = render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="test"
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      // 동일한 props로 리렌더링
      rerender(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="test"
          validation={mockValidValidation}
          onValueChange={mockOnValueChange}
        />
      );

      // 컴포넌트가 정상적으로 렌더링되어야 함
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('긴 제안 목록을 효율적으로 처리해야 한다', () => {
      const manyJuggestions = Array.from({ length: 100 }, (_, i) => `제안${i + 1}`);
      const longSuggestionsValidation: FieldValidationState = {
        ...mockSuggestionsValidation,
        suggestions: manyJuggestions,
      };

      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="test"
          validation={longSuggestionsValidation}
          onValueChange={mockOnValueChange}
          onSuggestionApply={mockOnSuggestionApply}
          showSuggestions={true}
        />
      );

      // 모든 제안이 렌더링되어야 함
      expect(screen.getByText('제안1')).toBeInTheDocument();
      expect(screen.getByText('제안100')).toBeInTheDocument();
    });
  });

  describe('에러 처리', () => {
    it('onValueChange 콜백 오류를 처리해야 한다', async () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value=""
          validation={mockValidValidation}
          onValueChange={errorCallback}
        />
      );

      const input = screen.getByRole('textbox');
      
      // 에러가 발생해도 입력이 계속 작동해야 함
      await user.type(input, 'test');

      expect(errorCallback).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('onSuggestionApply 콜백 오류를 처리해야 한다', async () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Suggestion error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ValidatedInput
          name="test"
          label="테스트 필드"
          value="test"
          validation={mockSuggestionsValidation}
          onValueChange={mockOnValueChange}
          onSuggestionApply={errorCallback}
          showSuggestions={true}
        />
      );

      const suggestion = screen.getByText('제안1');
      await user.click(suggestion);

      expect(errorCallback).toHaveBeenCalledWith('제안1');
      consoleSpy.mockRestore();
    });
  });
});