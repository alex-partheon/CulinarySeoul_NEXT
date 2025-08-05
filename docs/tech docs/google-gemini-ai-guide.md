# Google Gemini AI 통합 가이드

## 개요

Google Gemini AI는 CashUp 프로젝트의 AI 매칭 시스템과 콘텐츠 생성 기능을 담당하는 핵심 AI 엔진입니다. 크리에이터와 비즈니스 간의 지능적 매칭, 콘텐츠 추천, 자동화된 캠페인 분석 등을 제공합니다.

## 설치 및 환경 설정

### 기본 설치

```bash
npm install @google/generative-ai
npm install @types/node
```

### 환경 변수 설정

```bash
# .env.local
GOOGLE_API_KEY=your-google-gemini-api-key
GEMINI_MODEL=gemini-1.5-pro
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_OUTPUT_TOKENS=2048
```

### Gemini 클라이언트 설정

```typescript
// lib/gemini/client.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY 환경 변수가 설정되지 않았습니다');
}

export const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// 기본 모델 설정
export const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
  generationConfig: {
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
    maxOutputTokens: parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || '2048'),
    topP: 0.8,
    topK: 40,
  },
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
  ],
});

// 채팅 전용 모델
export const chatModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  generationConfig: {
    temperature: 0.9,
    maxOutputTokens: 1024,
  },
});
```

## 핵심 기능 및 사용법

### 1. 기본 텍스트 생성

```typescript
// lib/gemini/text-generation.ts
import { model } from './client';

export async function generateText(prompt: string): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('텍스트 생성 오류:', error);
    throw new Error('텍스트 생성에 실패했습니다');
  }
}

export async function generateContentIdeas(
  category: string,
  targetAudience: string,
  keywords: string[],
): Promise<string[]> {
  const prompt = `
다음 조건에 맞는 콘텐츠 아이디어 10개를 생성해주세요:

카테고리: ${category}
타겟 오디언스: ${targetAudience}
키워드: ${keywords.join(', ')}

각 아이디어는 다음 형식으로 작성해주세요:
- 제목: [매력적인 제목]
- 설명: [간단한 설명 1-2문장]
- 해시태그: [관련 해시태그 3-5개]

한국어로 작성해주세요.
  `;

  const result = await generateText(prompt);

  // 결과를 파싱하여 배열로 변환
  return result.split('\n\n').filter((idea) => idea.trim().length > 0);
}

export async function generateCampaignDescription(
  productName: string,
  targetAudience: string,
  campaignGoals: string[],
  budget: number,
): Promise<string> {
  const prompt = `
다음 정보를 바탕으로 매력적인 캠페인 설명을 작성해주세요:

제품명: ${productName}
타겟 오디언스: ${targetAudience}
캠페인 목표: ${campaignGoals.join(', ')}
예산: ${budget.toLocaleString()}원

캠페인 설명은 다음을 포함해야 합니다:
1. 제품/서비스 소개
2. 캠페인 목표
3. 크리에이터에게 기대하는 콘텐츠
4. 참여 혜택

한국어로 작성하고, 크리에이터들이 참여하고 싶어할 만한 매력적인 톤으로 작성해주세요.
  `;

  return await generateText(prompt);
}
```

### 2. 스트리밍 응답

```typescript
// lib/gemini/streaming.ts
import { model } from './client';

export async function* generateStreamingResponse(prompt: string) {
  try {
    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        yield chunkText;
      }
    }
  } catch (error) {
    console.error('스트리밍 생성 오류:', error);
    throw new Error('스트리밍 응답 생성에 실패했습니다');
  }
}

// React 컴포넌트에서 사용하는 훅
export function useStreamingGeneration() {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateContent = async (prompt: string) => {
    setIsGenerating(true);
    setContent('');

    try {
      for await (const chunk of generateStreamingResponse(prompt)) {
        setContent((prev) => prev + chunk);
      }
    } catch (error) {
      console.error('생성 오류:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return { content, isGenerating, generateContent };
}
```

### 3. 채팅 기능

```typescript
// lib/gemini/chat.ts
import { chatModel } from './client';

export class GeminiChat {
  private chat: any;
  private history: Array<{ role: 'user' | 'model'; parts: string }> = [];

  constructor(systemPrompt?: string) {
    const initialHistory = systemPrompt
      ? [
          {
            role: 'user' as const,
            parts: systemPrompt,
          },
          {
            role: 'model' as const,
            parts: '네, 이해했습니다. 도움이 필요하시면 언제든 말씀해주세요.',
          },
        ]
      : [];

    this.chat = chatModel.startChat({
      history: initialHistory,
    });

    this.history = [...initialHistory];
  }

  async sendMessage(message: string): Promise<string> {
    try {
      const result = await this.chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();

      // 히스토리 업데이트
      this.history.push({ role: 'user', parts: message }, { role: 'model', parts: text });

      return text;
    } catch (error) {
      console.error('채팅 메시지 전송 오류:', error);
      throw new Error('메시지 전송에 실패했습니다');
    }
  }

  async sendMessageStream(message: string) {
    try {
      const result = await this.chat.sendMessageStream(message);

      // 사용자 메시지를 히스토리에 추가
      this.history.push({ role: 'user', parts: message });

      let fullResponse = '';

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullResponse += chunkText;
          yield chunkText;
        }
      }

      // 완성된 응답을 히스토리에 추가
      this.history.push({ role: 'model', parts: fullResponse });
    } catch (error) {
      console.error('스트리밍 채팅 오류:', error);
      throw new Error('스트리밍 채팅에 실패했습니다');
    }
  }

  getHistory() {
    return this.history;
  }

  clearHistory() {
    this.history = [];
    this.chat = chatModel.startChat();
  }
}

// 캠페인 상담 챗봇
export function createCampaignConsultantBot() {
  const systemPrompt = `
당신은 CashUp의 캠페인 컨설턴트입니다. 다음 역할을 수행해주세요:

1. 비즈니스 고객의 마케팅 목표를 파악
2. 적합한 크리에이터 유형 추천
3. 캠페인 전략 제안
4. 예산 최적화 조언
5. 성과 측정 방법 안내

항상 친근하고 전문적인 톤으로 응답하며, 구체적이고 실행 가능한 조언을 제공해주세요.
한국어로 응답해주세요.
  `;

  return new GeminiChat(systemPrompt);
}

// 크리에이터 지원 챗봇
export function createCreatorSupportBot() {
  const systemPrompt = `
당신은 CashUp의 크리에이터 지원 전문가입니다. 다음 역할을 수행해주세요:

1. 콘텐츠 아이디어 제안
2. 캠페인 참여 가이드
3. 수익 최적화 조언
4. 플랫폼 사용법 안내
5. 트렌드 정보 제공

크리에이터의 성장을 돕는 것이 목표이며, 창의적이고 실용적인 조언을 제공해주세요.
한국어로 응답해주세요.
  `;

  return new GeminiChat(systemPrompt);
}
```

### 4. 함수 호출 (Function Calling)

```typescript
// lib/gemini/function-calling.ts
import { genAI } from './client';

// 함수 정의
const functions = {
  searchCreators: {
    name: 'searchCreators',
    description: '특정 조건에 맞는 크리에이터를 검색합니다',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: '크리에이터 카테고리 (beauty, fashion, lifestyle, tech, food)',
          enum: ['beauty', 'fashion', 'lifestyle', 'tech', 'food'],
        },
        minFollowers: {
          type: 'number',
          description: '최소 팔로워 수',
        },
        maxBudget: {
          type: 'number',
          description: '최대 예산',
        },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: '검색 키워드',
        },
      },
      required: ['category'],
    },
  },

  analyzeCampaignPerformance: {
    name: 'analyzeCampaignPerformance',
    description: '캠페인 성과를 분석합니다',
    parameters: {
      type: 'object',
      properties: {
        campaignId: {
          type: 'string',
          description: '캠페인 ID',
        },
        metrics: {
          type: 'array',
          items: { type: 'string' },
          description: '분석할 지표들 (views, engagement, conversions, roi)',
        },
      },
      required: ['campaignId'],
    },
  },

  generateContentStrategy: {
    name: 'generateContentStrategy',
    description: '콘텐츠 전략을 생성합니다',
    parameters: {
      type: 'object',
      properties: {
        brand: {
          type: 'string',
          description: '브랜드명',
        },
        targetAudience: {
          type: 'string',
          description: '타겟 오디언스',
        },
        goals: {
          type: 'array',
          items: { type: 'string' },
          description: '마케팅 목표',
        },
        timeline: {
          type: 'string',
          description: '캠페인 기간',
        },
      },
      required: ['brand', 'targetAudience'],
    },
  },
};

// 함수 실행 핸들러
const functionHandlers = {
  searchCreators: async (params: any) => {
    // 실제 크리에이터 검색 로직
    const { searchCreators } = await import('@/lib/api/creators');
    return await searchCreators(params);
  },

  analyzeCampaignPerformance: async (params: any) => {
    // 실제 캠페인 분석 로직
    const { analyzeCampaign } = await import('@/lib/analytics/campaigns');
    return await analyzeCampaign(params.campaignId, params.metrics);
  },

  generateContentStrategy: async (params: any) => {
    // 콘텐츠 전략 생성 로직
    const { generateStrategy } = await import('@/lib/strategy/content');
    return await generateStrategy(params);
  },
};

export class GeminiFunctionCalling {
  private model: any;

  constructor() {
    this.model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      tools: [{ functionDeclarations: Object.values(functions) }],
    });
  }

  async processRequest(userMessage: string): Promise<string> {
    try {
      const result = await this.model.generateContent(userMessage);
      const response = await result.response;

      // 함수 호출이 있는지 확인
      const functionCalls = response.functionCalls();

      if (functionCalls && functionCalls.length > 0) {
        const functionResponses = [];

        // 각 함수 호출 실행
        for (const functionCall of functionCalls) {
          const { name, args } = functionCall;

          if (functionHandlers[name as keyof typeof functionHandlers]) {
            try {
              const result = await functionHandlers[name as keyof typeof functionHandlers](args);
              functionResponses.push({
                name,
                response: result,
              });
            } catch (error) {
              console.error(`함수 ${name} 실행 오류:`, error);
              functionResponses.push({
                name,
                response: { error: '함수 실행에 실패했습니다' },
              });
            }
          }
        }

        // 함수 결과를 포함하여 최종 응답 생성
        const followUpResult = await this.model.generateContent([
          { text: userMessage },
          {
            functionResponse: {
              name: functionCalls[0].name,
              response: functionResponses[0].response,
            },
          },
        ]);

        return followUpResult.response.text();
      }

      return response.text();
    } catch (error) {
      console.error('함수 호출 처리 오류:', error);
      throw new Error('요청 처리에 실패했습니다');
    }
  }
}
```

## CashUp 특화 AI 기능

### 1. 크리에이터-비즈니스 매칭 시스템

```typescript
// lib/gemini/matching-system.ts
import { generateText } from './text-generation';
import { getCreators } from '@/lib/api/creators';
import { getCampaigns } from '@/lib/api/campaigns';

interface MatchingRequest {
  campaignId: string;
  requirements: {
    category: string;
    minFollowers: number;
    targetAudience: string;
    contentType: string[];
    budget: number;
  };
}

export async function findOptimalMatches(request: MatchingRequest) {
  // 1. 기본 필터링으로 후보 크리에이터 추출
  const candidates = await getCreators({
    category: request.requirements.category,
    minFollowers: request.requirements.minFollowers,
    verified: true,
  });

  // 2. AI를 통한 정교한 매칭 분석
  const matchingPrompt = `
다음 캠페인 요구사항에 가장 적합한 크리에이터들을 분석하고 순위를 매겨주세요:

캠페인 요구사항:
- 카테고리: ${request.requirements.category}
- 최소 팔로워: ${request.requirements.minFollowers.toLocaleString()}명
- 타겟 오디언스: ${request.requirements.targetAudience}
- 콘텐츠 유형: ${request.requirements.contentType.join(', ')}
- 예산: ${request.requirements.budget.toLocaleString()}원

후보 크리에이터들:
${candidates
  .map(
    (creator, index) => `
${index + 1}. ${creator.username}
   - 팔로워: ${creator.followers_count.toLocaleString()}명
   - 카테고리: ${creator.category}
   - 소개: ${creator.bio}
   - 인증 여부: ${creator.verified ? '인증됨' : '미인증'}
`,
  )
  .join('')}

각 크리에이터에 대해 다음을 분석해주세요:
1. 매칭 점수 (1-100점)
2. 매칭 이유
3. 예상 성과
4. 추천 콘텐츠 전략

JSON 형식으로 응답해주세요:
{
  "matches": [
    {
      "creatorId": "creator_id",
      "score": 95,
      "reasoning": "매칭 이유",
      "expectedPerformance": "예상 성과",
      "contentStrategy": "추천 전략"
    }
  ]
}
  `;

  const aiResponse = await generateText(matchingPrompt);

  try {
    const analysis = JSON.parse(aiResponse);

    // 점수순으로 정렬하고 상위 5명 반환
    return analysis.matches
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 5)
      .map((match: any) => {
        const creator = candidates.find((c) => c.id === match.creatorId);
        return {
          ...creator,
          aiAnalysis: {
            score: match.score,
            reasoning: match.reasoning,
            expectedPerformance: match.expectedPerformance,
            contentStrategy: match.contentStrategy,
          },
        };
      });
  } catch (error) {
    console.error('AI 매칭 분석 파싱 오류:', error);
    // 폴백: 기본 점수 계산
    return candidates.slice(0, 5);
  }
}

export async function generateMatchingInsights(creatorId: string, campaignId: string) {
  const prompt = `
크리에이터와 캠페인 간의 매칭에 대한 상세한 인사이트를 제공해주세요:

분석 항목:
1. 오디언스 적합성
2. 콘텐츠 스타일 매칭
3. 예상 참여율
4. ROI 예측
5. 리스크 요소
6. 성공을 위한 권장사항

한국어로 상세하고 실용적인 분석을 제공해주세요.
  `;

  return await generateText(prompt);
}
```

### 2. 콘텐츠 최적화 시스템

```typescript
// lib/gemini/content-optimization.ts
export async function optimizeContentForPlatform(
  content: string,
  platform: 'instagram' | 'youtube' | 'tiktok' | 'blog',
  targetAudience: string,
) {
  const platformSpecs = {
    instagram: {
      maxLength: 2200,
      hashtagLimit: 30,
      style: '시각적이고 간결한',
      features: '해시태그, 멘션, 스토리 연동',
    },
    youtube: {
      maxLength: 5000,
      hashtagLimit: 15,
      style: '상세하고 설명적인',
      features: '타임스탬프, 챕터, 링크',
    },
    tiktok: {
      maxLength: 300,
      hashtagLimit: 10,
      style: '트렌디하고 재미있는',
      features: '해시태그, 챌린지, 음악',
    },
    blog: {
      maxLength: 10000,
      hashtagLimit: 10,
      style: '전문적이고 상세한',
      features: 'SEO 키워드, 내부 링크, 이미지',
    },
  };

  const spec = platformSpecs[platform];

  const prompt = `
다음 콘텐츠를 ${platform} 플랫폼에 최적화해주세요:

원본 콘텐츠:
${content}

플랫폼 요구사항:
- 최대 길이: ${spec.maxLength}자
- 해시태그 제한: ${spec.hashtagLimit}개
- 스타일: ${spec.style}
- 주요 기능: ${spec.features}

타겟 오디언스: ${targetAudience}

최적화된 콘텐츠를 다음 형식으로 제공해주세요:

1. 제목/캡션
2. 본문
3. 해시태그
4. 추가 권장사항

한국어로 작성해주세요.
  `;

  return await generateText(prompt);
}

export async function generateHashtags(
  content: string,
  category: string,
  count: number = 10,
): Promise<string[]> {
  const prompt = `
다음 콘텐츠에 적합한 해시태그 ${count}개를 생성해주세요:

콘텐츠: ${content}
카테고리: ${category}

조건:
- 인기 있고 관련성 높은 해시태그
- 브랜드 인지도 향상에 도움
- 타겟 오디언스가 검색할 만한 키워드
- 한국어와 영어 혼합

해시태그만 나열해주세요 (# 포함):
  `;

  const result = await generateText(prompt);

  // 해시태그 추출 및 정리
  const hashtags = result
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('#'))
    .slice(0, count);

  return hashtags;
}

export async function analyzeContentTrends(category: string, period: string = '최근 1개월') {
  const prompt = `
${category} 카테고리의 ${period} 콘텐츠 트렌드를 분석해주세요:

분석 항목:
1. 인기 키워드 및 해시태그
2. 주요 콘텐츠 형식
3. 참여율이 높은 콘텐츠 특징
4. 새로운 트렌드
5. 향후 전망

실용적이고 구체적인 인사이트를 한국어로 제공해주세요.
  `;

  return await generateText(prompt);
}
```

### 3. 캠페인 성과 분석

```typescript
// lib/gemini/performance-analysis.ts
interface CampaignMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  conversions: number;
  reach: number;
  impressions: number;
  cost: number;
}

export async function analyzeCampaignPerformance(
  metrics: CampaignMetrics,
  campaignGoals: string[],
  industry: string,
) {
  const engagementRate =
    ((metrics.likes + metrics.comments + metrics.shares) / metrics.views) * 100;
  const clickThroughRate = (metrics.clicks / metrics.impressions) * 100;
  const conversionRate = (metrics.conversions / metrics.clicks) * 100;
  const costPerConversion = metrics.cost / metrics.conversions;

  const prompt = `
다음 캠페인 성과를 분석하고 개선 방안을 제시해주세요:

성과 지표:
- 조회수: ${metrics.views.toLocaleString()}
- 좋아요: ${metrics.likes.toLocaleString()}
- 댓글: ${metrics.comments.toLocaleString()}
- 공유: ${metrics.shares.toLocaleString()}
- 클릭: ${metrics.clicks.toLocaleString()}
- 전환: ${metrics.conversions.toLocaleString()}
- 도달: ${metrics.reach.toLocaleString()}
- 노출: ${metrics.impressions.toLocaleString()}
- 비용: ${metrics.cost.toLocaleString()}원

계산된 지표:
- 참여율: ${engagementRate.toFixed(2)}%
- 클릭률: ${clickThroughRate.toFixed(2)}%
- 전환율: ${conversionRate.toFixed(2)}%
- 전환당 비용: ${costPerConversion.toLocaleString()}원

캠페인 목표: ${campaignGoals.join(', ')}
업계: ${industry}

분석 내용:
1. 전반적인 성과 평가
2. 강점과 약점
3. 업계 평균 대비 비교
4. 목표 달성도
5. 구체적인 개선 방안
6. 다음 캠페인을 위한 권장사항

한국어로 상세하고 실용적인 분석을 제공해주세요.
  `;

  return await generateText(prompt);
}

export async function generatePerformanceReport(
  campaignId: string,
  timeframe: string,
  metrics: CampaignMetrics[],
) {
  const totalMetrics = metrics.reduce(
    (acc, curr) => ({
      views: acc.views + curr.views,
      likes: acc.likes + curr.likes,
      comments: acc.comments + curr.comments,
      shares: acc.shares + curr.shares,
      clicks: acc.clicks + curr.clicks,
      conversions: acc.conversions + curr.conversions,
      reach: acc.reach + curr.reach,
      impressions: acc.impressions + curr.impressions,
      cost: acc.cost + curr.cost,
    }),
    {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
      conversions: 0,
      reach: 0,
      impressions: 0,
      cost: 0,
    },
  );

  const prompt = `
캠페인 성과 리포트를 작성해주세요:

캠페인 ID: ${campaignId}
기간: ${timeframe}

총 성과:
${Object.entries(totalMetrics)
  .map(([key, value]) => `- ${key}: ${value.toLocaleString()}`)
  .join('\n')}

리포트 구성:
1. 요약 (Executive Summary)
2. 주요 성과 지표
3. 트렌드 분석
4. 성공 요인
5. 개선 영역
6. 권장사항
7. 다음 단계

전문적이고 이해하기 쉬운 형태로 한국어로 작성해주세요.
  `;

  return await generateText(prompt);
}
```

### 4. 개인화된 추천 시스템

```typescript
// lib/gemini/recommendation-system.ts
interface UserProfile {
  id: string;
  type: 'creator' | 'business';
  interests: string[];
  pastCampaigns: string[];
  preferences: Record<string, any>;
  performance: Record<string, number>;
}

export async function generatePersonalizedRecommendations(
  user: UserProfile,
  context: 'campaigns' | 'creators' | 'content' | 'strategies',
) {
  const contextPrompts = {
    campaigns: '참여하기 좋은 캠페인',
    creators: '협업하기 좋은 크리에이터',
    content: '제작하면 좋을 콘텐츠',
    strategies: '마케팅 전략',
  };

  const prompt = `
다음 사용자에게 ${contextPrompts[context]}을 추천해주세요:

사용자 정보:
- 유형: ${user.type === 'creator' ? '크리에이터' : '비즈니스'}
- 관심사: ${user.interests.join(', ')}
- 과거 캠페인: ${user.pastCampaigns.length}개
- 선호도: ${JSON.stringify(user.preferences, null, 2)}
- 성과: ${JSON.stringify(user.performance, null, 2)}

추천 기준:
1. 사용자의 관심사와 전문성
2. 과거 성과 패턴
3. 현재 트렌드
4. 성장 가능성
5. 수익성

각 추천에 대해 다음을 포함해주세요:
- 추천 이유
- 예상 성과
- 실행 방법
- 주의사항

한국어로 구체적이고 실용적인 추천을 제공해주세요.
  `;

  return await generateText(prompt);
}

export async function generateContentCalendar(
  creatorProfile: UserProfile,
  timeframe: string = '1개월',
  postFrequency: number = 3,
) {
  const prompt = `
다음 크리에이터를 위한 ${timeframe} 콘텐츠 캘린더를 작성해주세요:

크리에이터 정보:
- 관심사: ${creatorProfile.interests.join(', ')}
- 과거 성과: ${JSON.stringify(creatorProfile.performance, null, 2)}
- 선호도: ${JSON.stringify(creatorProfile.preferences, null, 2)}

요구사항:
- 주 ${postFrequency}회 포스팅
- 다양한 콘텐츠 형식 포함
- 트렌드 반영
- 참여도 최적화

각 콘텐츠에 대해 다음을 포함해주세요:
- 날짜
- 콘텐츠 유형
- 주제
- 예상 해시태그
- 제작 팁

표 형식으로 정리하여 한국어로 제공해주세요.
  `;

  return await generateText(prompt);
}
```

## 실시간 AI 채팅 구현

### 1. 채팅 인터페이스

```tsx
// components/ai-chat/chat-interface.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { GeminiChat } from '@/lib/gemini/chat';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  type: 'campaign-consultant' | 'creator-support' | 'general';
  userId: string;
}

export function AIChat({ type, userId }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chat] = useState(() => {
    if (type === 'campaign-consultant') {
      return createCampaignConsultantBot();
    } else if (type === 'creator-support') {
      return createCreatorSupportBot();
    }
    return new GeminiChat();
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chat.sendMessage(input);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-96 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* 헤더 */}
      <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <Bot className="w-6 h-6 text-primary-500 mr-2" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          {type === 'campaign-consultant' && '캠페인 컨설턴트'}
          {type === 'creator-support' && '크리에이터 지원'}
          {type === 'general' && 'AI 어시스턴트'}
        </h3>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400">
            안녕하세요! 무엇을 도와드릴까요?
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-2 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-500" />
              </div>
            )}

            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-500" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-2">
            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-500" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 2. 스트리밍 채팅

```tsx
// components/ai-chat/streaming-chat.tsx
'use client';

import { useState } from 'react';
import { useStreamingGeneration } from '@/lib/gemini/streaming';

export function StreamingChat() {
  const [input, setInput] = useState('');
  const { content, isGenerating, generateContent } = useStreamingGeneration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    await generateContent(input);
    setInput('');
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="질문을 입력하세요..."
          className="flex-1 input"
          disabled={isGenerating}
        />
        <button type="submit" disabled={!input.trim() || isGenerating} className="btn-primary">
          {isGenerating ? '생성 중...' : '전송'}
        </button>
      </form>

      {content && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="whitespace-pre-wrap">{content}</div>
          {isGenerating && <div className="mt-2 text-sm text-gray-500">생성 중...</div>}
        </div>
      )}
    </div>
  );
}
```

## 성능 최적화 및 모니터링

### 1. 요청 최적화

```typescript
// lib/gemini/optimization.ts
import { LRUCache } from 'lru-cache';

// 응답 캐싱
const responseCache = new LRUCache<string, string>({
  max: 1000,
  ttl: 1000 * 60 * 30, // 30분
});

export async function cachedGenerateText(prompt: string): Promise<string> {
  const cacheKey = Buffer.from(prompt).toString('base64');

  // 캐시에서 확인
  const cached = responseCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // 새로 생성
  const result = await generateText(prompt);
  responseCache.set(cacheKey, result);

  return result;
}

// 요청 제한
const requestLimiter = new Map<string, number[]>();

export function checkRateLimit(
  userId: string,
  limit: number = 10,
  window: number = 60000,
): boolean {
  const now = Date.now();
  const userRequests = requestLimiter.get(userId) || [];

  // 윈도우 밖의 요청 제거
  const validRequests = userRequests.filter((time) => now - time < window);

  if (validRequests.length >= limit) {
    return false;
  }

  validRequests.push(now);
  requestLimiter.set(userId, validRequests);

  return true;
}

// 배치 처리
export async function batchGenerateText(prompts: string[]): Promise<string[]> {
  const batchSize = 5;
  const results: string[] = [];

  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((prompt) => generateText(prompt)));
    results.push(...batchResults);

    // 배치 간 지연
    if (i + batchSize < prompts.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
```

### 2. 에러 처리 및 재시도

```typescript
// lib/gemini/error-handling.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      // 지수 백오프
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

export async function safeGenerateText(prompt: string): Promise<string> {
  return retryWithBackoff(async () => {
    const result = await generateText(prompt);

    if (!result || result.trim().length === 0) {
      throw new Error('빈 응답을 받았습니다');
    }

    return result;
  });
}
```

## 참고 자료

- [Google Gemini API 공식 문서](https://ai.google.dev/docs)
- [Generative AI JavaScript SDK](https://github.com/google/generative-ai-js)
- [Gemini API 안전 가이드](https://ai.google.dev/docs/safety_guidance)
- [Function Calling 가이드](https://ai.google.dev/docs/function_calling)

---

**작성일**: 2024년 12월
**버전**: 1.0
**담당자**: CashUp 개발팀
