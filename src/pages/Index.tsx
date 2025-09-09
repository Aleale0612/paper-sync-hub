// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Paper Sync Hub</h1>
        <p className="text-xl text-muted-foreground mb-6">Your comprehensive platform with trading journal integration!</p>
        <div className="space-y-4">
          <a href="/journal/auth" className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            Access Trading Journal
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
