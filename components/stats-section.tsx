export function StatsSection() {
  const stats = [
    { value: "50,000+", label: "Happy Singles" },
    { value: "2,500+", label: "Events Hosted" },
    { value: "15,000+", label: "Matches Made" },
    { value: "42", label: "Cities Worldwide" },
  ]

  return (
    <section className="py-16 md:py-20 bg-card border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-2">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
