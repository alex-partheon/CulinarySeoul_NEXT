import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50">
      <div className="absolute inset-0 bg-grid-black/[0.02] -z-10" />
      
      <div className="w-full max-w-md px-4">
        <div className="relative">
          {/* 보라색 그라디언트 배경 장식 */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-20 animate-pulse" />
          
          <div className="relative bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                로그인
              </h1>
              <p className="mt-2 text-gray-600">
                CulinarySeoul ERP에 오신 것을 환영합니다
              </p>
            </div>
            
            <SignIn 
              path="/sign-in"
              routing="path"
              redirectUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "border-0 shadow-none p-0",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  formButtonPrimary: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200",
                  formFieldInput: "rounded-lg border-gray-200 focus:border-purple-400 focus:ring-purple-400",
                  footerActionLink: "text-purple-600 hover:text-purple-700 font-medium",
                  dividerLine: "bg-gray-200",
                  dividerText: "text-gray-500 text-sm",
                  socialButtonsBlockButton: "border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors",
                  socialButtonsBlockButtonText: "text-gray-700 font-medium",
                  formFieldLabel: "text-gray-700 font-medium mb-2",
                  identityPreviewText: "text-gray-700",
                  identityPreviewEditButtonIcon: "text-purple-600",
                },
                layout: {
                  socialButtonsPlacement: "top",
                  socialButtonsVariant: "blockButton",
                },
                variables: {
                  colorPrimary: "#7c3aed",
                  colorText: "#374151",
                  colorTextSecondary: "#6b7280",
                  colorBackground: "#ffffff",
                  colorInputBackground: "#ffffff",
                  colorInputText: "#1f2937",
                  colorSuccess: "#10b981",
                  colorWarning: "#f59e0b",
                  colorDanger: "#ef4444",
                  fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  fontSize: "16px",
                  borderRadius: "0.75rem",
                  spacingUnit: "1rem",
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}