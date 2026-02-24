import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Clock, Users, Trophy, Play, Github } from 'lucide-react';
import courseHeroImage from '@/assets/images/Course_hero_background_image_dee9776b.png';
import femaleInstructorImage from '@/assets/images/Female_instructor_portrait_fa1e47b3.png';
import testimonialImage from '@/assets/images/Student_testimonial_photo_5b78ee7e.png';

interface CourseInfo {
  title: string;
  description: string;
  instructor: string;
  rating: number;
  students: number;
  duration: string;
  price: number;
  originalPrice?: number;
}

interface EnrollmentGatewayProps {
  courseInfo: CourseInfo;
  onLogin: (email: string, password: string) => void;
  onSignup: (email: string, password: string, name: string, phone: string) => void;
  onSocialLogin: (provider: string) => void;
}

export default function EnrollmentGateway({
  courseInfo,
  onLogin,
  onSignup,
  onSocialLogin
}: EnrollmentGatewayProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onLogin(email, password);
      console.log('Login attempted:', email);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSignup(email, password, name, phone);
      console.log('Signup attempted:', email, name, phone);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    console.log('Social login with:', provider);
    onSocialLogin(provider);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="container-enrollment">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left Side - Course Information */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
          <img
            src={courseHeroImage}
            alt="Course preview"
            className="absolute inset-0 w-full h-full object-cover"
            data-testid="img-course-hero"
          />
          <div className="relative z-10 p-8 lg:p-12 flex flex-col justify-center h-full text-white">
            <div className="max-w-lg">
              <Badge className="mb-4 bg-white/20 backdrop-blur-sm" data-testid="badge-course-category">
                Professional Development
              </Badge>

              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight" data-testid="title-course">
                {courseInfo.title}
              </h1>

              <p className="text-lg mb-8 text-white/90 leading-relaxed" data-testid="text-course-description">
                {courseInfo.description}
              </p>

              {/* Course Stats */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="flex items-center space-x-2" data-testid="stat-rating">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{courseInfo.rating}/5</span>
                  <span className="text-sm text-white/80">({(courseInfo.students || 0).toLocaleString()} students)</span>
                </div>
                <div className="flex items-center space-x-2" data-testid="stat-duration">
                  <Clock className="w-5 h-5" />
                  <span>{courseInfo.duration}</span>
                </div>
              </div>

              {/* Instructor */}
              <div className="flex items-center space-x-4 mb-8">
                <img
                  src={femaleInstructorImage}
                  alt={courseInfo.instructor}
                  className="w-12 h-12 rounded-full border-2 border-white/20"
                  data-testid="img-instructor"
                />
                <div>
                  <p className="font-semibold" data-testid="text-instructor-name">{courseInfo.instructor}</p>
                  <p className="text-sm text-white/80">Senior Software Engineer at TechCorp</p>
                </div>
              </div>

              {/* Testimonial */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20" data-testid="card-testimonial">
                <div className="flex items-start space-x-4">
                  <img
                    src={testimonialImage}
                    alt="Student testimonial"
                    className="w-12 h-12 rounded-full"
                    data-testid="img-testimonial"
                  />
                  <div>
                    <p className="text-sm mb-2 italic">"This course transformed my career. The practical examples and hands-on projects made complex concepts easy to understand."</p>
                    <p className="text-xs text-white/80">- Sarah Chen, Full Stack Developer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login/Signup Forms */}
        <div className="flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold mb-2" data-testid="title-enrollment">Start Learning Today</h2>
              <p className="text-muted-foreground">Join thousands of students advancing their careers</p>
            </div>

            <Card className="shadow-lg" data-testid="card-auth-form">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-3xl font-bold" data-testid="text-price">
                      ${courseInfo.price}
                    </span>
                    {courseInfo.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through ml-2" data-testid="text-original-price">
                        ${courseInfo.originalPrice}
                      </span>
                    )}
                  </div>
                  <Badge variant="destructive" data-testid="badge-discount">50% OFF</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" className="w-full" data-testid="tabs-auth">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
                    <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-4">
                    <form onSubmit={handleLogin} className="space-y-4" data-testid="form-login">
                      <div>
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          required
                          data-testid="input-login-email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          data-testid="input-login-password"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                        data-testid="button-login"
                      >
                        {isLoading ? 'Logging in...' : 'Login & Enroll'}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-4">
                    <form onSubmit={handleSignup} className="space-y-4" data-testid="form-signup">
                      <div>
                        <Label htmlFor="signup-name">Full Name</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name"
                          required
                          data-testid="input-signup-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          required
                          data-testid="input-signup-email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="signup-phone">Phone Number</Label>
                        <Input
                          id="signup-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Enter your phone number"
                          required
                          data-testid="input-signup-phone"
                        />
                      </div>
                      <div>
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a password"
                          required
                          data-testid="input-signup-password"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                        data-testid="button-signup"
                      >
                        {isLoading ? 'Creating Account...' : 'Sign Up & Enroll'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => handleSocialLogin('google')}
                      className="w-full"
                      data-testid="button-google-auth"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Google
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleSocialLogin('github')}
                      className="w-full"
                      data-testid="button-github-auth"
                    >
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </Button>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    <Trophy className="w-4 h-4" />
                    <span>30-day money-back guarantee</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}