export default function TestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-primary">Tailwind CSS v4 Test Page</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card p-6 rounded-lg border border-border shadow-md">
            <h2 className="text-xl font-semibold text-card-foreground mb-2">Primary Color</h2>
            <div className="w-full h-20 bg-primary rounded" />
            <p className="text-sm text-muted-foreground mt-2">HSL: var(--primary)</p>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border shadow-md">
            <h2 className="text-xl font-semibold text-card-foreground mb-2">Secondary Color</h2>
            <div className="w-full h-20 bg-secondary rounded" />
            <p className="text-sm text-muted-foreground mt-2">HSL: var(--secondary)</p>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border shadow-md">
            <h2 className="text-xl font-semibold text-card-foreground mb-2">Accent Color</h2>
            <div className="w-full h-20 bg-accent rounded" />
            <p className="text-sm text-muted-foreground mt-2">HSL: var(--accent)</p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-2xl font-semibold mb-4">Typography Test</h2>
          <p className="text-foreground">Regular text with foreground color</p>
          <p className="text-muted-foreground">Muted text with muted-foreground color</p>
          <p className="text-primary">Primary colored text</p>
          <p className="text-secondary">Secondary colored text</p>
          <p className="text-destructive">Destructive colored text</p>
        </div>

        <div className="bg-gradient-to-r from-primary to-secondary p-8 rounded-lg text-primary-foreground">
          <h2 className="text-2xl font-bold mb-2">Gradient Test</h2>
          <p>This tests the gradient functionality with Tailwind CSS v4</p>
        </div>

        <div className="flex gap-4">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
            Primary Button
          </button>
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 transition-colors">
            Secondary Button
          </button>
          <button className="px-4 py-2 border border-border rounded hover:bg-accent hover:text-accent-foreground transition-colors">
            Outline Button
          </button>
        </div>
      </div>
    </div>
  );
}
