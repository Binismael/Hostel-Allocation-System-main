import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Users,
  Building2,
  BarChart3,
  Lock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Zap,
  Shield,
  TrendingUp,
  Clock,
  Award,
  Lightbulb,
} from "lucide-react";

const hostels = [
  {
    name: "New Hostel",
    details: "8 self-contained rooms",
    images: [
      {
        src: "https://cdn.builder.io/api/v1/image/assets%2Fd51db21242644bff87f6c68e2397daf7%2Fcae20b7dac8c49499afb0afe05f82caf?format=webp&width=800&height=1200",
        alt: "Courtyard view of the New Hostel",
      },
      {
        src: "https://cdn.builder.io/api/v1/image/assets%2Fd51db21242644bff87f6c68e2397daf7%2F3b19b85cf179429084fc57f4baba27e1?format=webp&width=800&height=1200",
        alt: "Front view of the New Hostel rooms",
      },
      {
        src: "https://cdn.builder.io/api/v1/image/assets%2Fd51db21242644bff87f6c68e2397daf7%2Fb15d231eaf2c4bd3b6ee1ca7109c1777?format=webp&width=800&height=1200",
        alt: "Side view of the New Hostel",
      },
    ],
  },
  {
    name: "Police Hostel",
    details: "14 rooms",
    images: [
      {
        src: "https://cdn.builder.io/api/v1/image/assets%2Fd51db21242644bff87f6c68e2397daf7%2Fe9d8661cbb6349afa8544e6dac62eba4?format=webp&width=800&height=1200",
        alt: "Front view of the Police Hostel",
      },
      {
        src: "https://cdn.builder.io/api/v1/image/assets%2Fd51db21242644bff87f6c68e2397daf7%2Ff7b5849983bc4791a9aa4eec589fb9cd?format=webp&width=800&height=1200",
        alt: "Side view of the Police Hostel",
      },
    ],
  },
  {
    name: "Jonkel Hostel",
    details: "28 self-contained rooms",
    images: [
      {
        src: "https://cdn.builder.io/api/v1/image/assets%2Fd51db21242644bff87f6c68e2397daf7%2Fd38cd0451d04443a8a9a0f89dfce319f?format=webp&width=800&height=1200",
        alt: "Front view of Jonkel Hostel",
      },
      {
        src: "https://cdn.builder.io/api/v1/image/assets%2Fd51db21242644bff87f6c68e2397daf7%2Fac0ec5ad35df4dbf98803634d9928aae?format=webp&width=800&height=1200",
        alt: "Exterior view of Jonkel Hostel",
      },
    ],
  },
  {
    name: "Peace of Mind Hostel",
    details: "14 self-contained rooms",
    images: [
      {
        src: "https://cdn.builder.io/api/v1/image/assets%2Fd51db21242644bff87f6c68e2397daf7%2F1694f3005bc645f2911f59e9031b0d82?format=webp&width=800&height=1200",
        alt: "Front view of Peace of Mind Hostel",
      },
      {
        src: "https://cdn.builder.io/api/v1/image/assets%2Fd51db21242644bff87f6c68e2397daf7%2Fe97b3111a01349f1ab33f17eaf20260e?format=webp&width=800&height=1200",
        alt: "Side view of Peace of Mind Hostel",
      },
    ],
  },
];

function HostelGallery({ hostel }: { hostel: (typeof hostels)[number] }) {
  const [selected, setSelected] = useState(0);
  const image = hostel.images[selected];

  return (
    <section aria-label={`${hostel.name} photo gallery`}>
      <div className="rounded-xl overflow-hidden shadow-lg">
        <AspectRatio ratio={16 / 9} className="bg-secondary/20">
          <img src={image.src} alt={image.alt} className="w-full h-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          <p className="absolute bottom-4 left-5 text-sm font-medium text-white sm:bottom-6 sm:left-7">
            {hostel.name} · {hostel.details}
          </p>
          <div className="absolute bottom-3 right-4 flex gap-2 sm:bottom-5 sm:right-6">
            <button
              type="button"
              aria-label={`Previous ${hostel.name} photo`}
              onClick={() => setSelected((selected - 1 + hostel.images.length) % hostel.images.length)}
              className="rounded-full bg-white/90 p-2 text-foreground shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label={`Next ${hostel.name} photo`}
              onClick={() => setSelected((selected + 1) % hostel.images.length)}
              className="rounded-full bg-white/90 p-2 text-foreground shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </AspectRatio>
      </div>
      <div className={`mt-4 grid gap-3 sm:gap-4 ${hostel.images.length === 3 ? "grid-cols-3" : "grid-cols-2"}`} aria-label={`Choose a ${hostel.name} photo`}>
        {hostel.images.map((photo, index) => (
          <button
            key={photo.src}
            type="button"
            aria-label={`View photo ${index + 1}: ${photo.alt}`}
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
            className={`overflow-hidden rounded-lg border-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selected === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}
          >
            <img src={photo.src} alt="" className="h-20 w-full object-cover sm:h-28" loading="lazy" />
          </button>
        ))}
      </div>
    </section>
  );
}

function HostelsSection() {
  return (
    <section id="hostels" className="bg-secondary/10 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-bold text-foreground">Our Hostels</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Explore accommodation across our campus.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
          {hostels.map((hostel) => (
            <HostelGallery key={hostel.name} hostel={hostel} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const features = [
    {
      icon: Users,
      title: "Student Management",
      description: "Easily manage student profiles, requests, and allocations",
    },
    {
      icon: Building2,
      title: "Room Management",
      description: "Track rooms, blocks, and availability in real-time",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "View occupancy rates and allocation statistics",
    },
    {
      icon: Lock,
      title: "Secure System",
      description: "Role-based access control and data protection",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fece4a38457b3429d9a1e0894c73e7ff5%2F4ecbbe642ea440d8b9b0f1335b69fa8f?format=webp&width=800"
            alt="Foreign Links Campus Logo"
            className="w-16 h-16 object-contain"
          />
          <div className="flex gap-3">
            <Link to="/student/login">
              <Button variant="outline">Student Login</Button>
            </Link>
            <Link to="/admin/dashboard">
              <Button className="bg-primary hover:bg-primary/90">
                Admin Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">
            Foreign Links Campus Hostel Management
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Welcome to Foreign Links Campus Moro Ife North. Our comprehensive
            hostel allocation system helps manage room assignments, student
            requests, and accommodation administration efficiently.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link to="/student/login">
              <Button
                size="lg"
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                Student Portal
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/admin/dashboard">
              <Button size="lg" variant="outline">
                Admin Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <HostelsSection />

      {/* Features Section */}
      <section id="features" className="bg-secondary/20 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Powerful Features
            </h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to manage hostel allocations efficiently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border border-border p-6">
                  <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Capabilities */}
      <section
        id="benefits"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Key Capabilities
          </h2>
          <p className="text-muted-foreground text-lg">
            Streamline your hostel management process
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            "Real-time room availability tracking",
            "Automated allocation generation with unique IDs",
            "Color-coded status indicators (green, yellow, red)",
            "Advanced search and filter capabilities",
            "Student request management and processing",
            "Admin dashboard with analytics",
            "Comprehensive data tables with sorting",
            "Mobile-responsive design",
          ].map((capability, index) => (
            <div key={index} className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-1" />
              <div>
                <p className="text-foreground font-medium">{capability}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-secondary/20 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg">
              A streamlined process designed for efficiency and transparency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border border-border p-6 text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Students Submit Requests
              </h3>
              <p className="text-muted-foreground">
                Students create accounts and submit their hostel room allocation
                requests with preferences and requirements.
              </p>
            </Card>

            <Card className="border border-border p-6 text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Automated Processing
              </h3>
              <p className="text-muted-foreground">
                The system intelligently processes allocations based on
                availability, preferences, and institutional policies.
              </p>
            </Card>

            <Card className="border border-border p-6 text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Instant Confirmation
              </h3>
              <p className="text-muted-foreground">
                Students receive immediate confirmation with their allocation
                details and can track their status in real-time.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* For Students Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-foreground mb-6">
              For Students
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              The Foreign Links Campus hostel allocation system empowers
              students with transparency and control over their accommodation
              requests.
            </p>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                <span className="text-foreground">
                  Easy online room request submission
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                <span className="text-foreground">
                  Real-time allocation status tracking
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                <span className="text-foreground">
                  View available rooms and blocks
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                <span className="text-foreground">
                  Access allocation confirmation details
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                <span className="text-foreground">
                  Mobile-friendly student portal
                </span>
              </li>
            </ul>
            <Link to="/student/login" className="inline-block mt-8">
              <Button
                size="lg"
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                Access Student Portal
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
          <Card className="border border-border p-8 bg-secondary/10">
            <h3 className="text-2xl font-semibold text-foreground mb-6">
              Student Benefits
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Clock className="w-6 h-6 text-primary flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground">Save Time</h4>
                  <p className="text-sm text-muted-foreground">
                    Complete allocation in minutes, not hours
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Shield className="w-6 h-6 text-primary flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground">
                    Fair & Transparent
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Know your status every step of the way
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Award className="w-6 h-6 text-primary flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground">
                    Secure Access
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Personal data protected with authentication
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* For Administrators Section */}
      <section className="bg-secondary/20 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <Card className="border border-border p-8 bg-primary/5 order-last md:order-first">
              <h3 className="text-2xl font-semibold text-foreground mb-6">
                Admin Advantages
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <TrendingUp className="w-6 h-6 text-primary flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Detailed Analytics
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Track occupancy rates and allocation patterns
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Zap className="w-6 h-6 text-primary flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Automated Processing
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Reduce manual work with intelligent algorithms
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Lightbulb className="w-6 h-6 text-primary flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Full Control
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Manage all allocations from one dashboard
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                For Administrators
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Manage hostel operations efficiently with comprehensive
                administrative tools and real-time insights.
              </p>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">
                    Manage student profiles and database
                  </span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">
                    Configure hostel blocks and rooms
                  </span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">
                    Generate and manage allocations
                  </span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">
                    View comprehensive analytics and reports
                  </span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">
                    Role-based access control and security
                  </span>
                </li>
              </ul>
              <Link to="/admin/dashboard" className="inline-block mt-8">
                <Button size="lg" variant="outline">
                  Admin Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Why Choose Our System?
          </h2>
          <p className="text-muted-foreground text-lg">
            Built specifically for educational institutions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border border-border p-6">
            <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Fast & Efficient
            </h3>
            <p className="text-muted-foreground">
              Reduce allocation time from weeks to days with automated
              processing
            </p>
          </Card>

          <Card className="border border-border p-6">
            <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Secure & Reliable
            </h3>
            <p className="text-muted-foreground">
              Enterprise-grade security with role-based access control
            </p>
          </Card>

          <Card className="border border-border p-6">
            <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Proven Results
            </h3>
            <p className="text-muted-foreground">
              Trusted by educational institutions for fair and transparent
              allocations
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Choose your portal to manage your hostel allocation at Foreign Links
            Campus.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/student/login">
              <Button
                size="lg"
                className="gap-2 bg-white text-primary hover:bg-gray-100"
              >
                Student Portal
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/admin/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Admin Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-muted-foreground">
            © 2026 Foreign Links Campus Moro Ife North. Hostel Management
            System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
