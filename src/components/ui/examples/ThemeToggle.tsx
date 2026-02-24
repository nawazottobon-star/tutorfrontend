import ThemeToggle from '../ThemeToggle';

export default function ThemeToggleExample() {
  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Theme Toggle</h2>
          <ThemeToggle />
        </div>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Click the theme toggle button above to switch between light and dark modes. 
            The preference is saved in localStorage.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-card border border-card-border rounded-lg">
              <h3 className="font-semibold mb-2">Card Example</h3>
              <p className="text-sm text-muted-foreground">
                This card demonstrates how colors adapt to the current theme.
              </p>
            </div>
            
            <div className="p-4 bg-primary text-primary-foreground rounded-lg">
              <h3 className="font-semibold mb-2">Primary Card</h3>
              <p className="text-sm">
                Primary colors also adapt automatically to maintain proper contrast.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}