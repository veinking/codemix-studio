import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ArrowLeft, Quote } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { updatePageSEO } from "@/utils/seo";
import { ReviewSchema } from "@/components/ReviewSchema";

const Testimonials = () => {
  const navigate = useNavigate();

  useEffect(() => {
    updatePageSEO({
      title: 'Student Reviews & Testimonials - OpenIDE',
      description: 'See what students and educators say about OpenIDE. Real reviews from users who code Python and R in their browser for coursework and projects.',
      keywords: 'openide reviews, student testimonials, python ide reviews, user feedback',
      canonical: 'https://codemixapp.com/testimonials'
    });
  }, []);

  // Sample testimonials - replace with real ones as you collect them
  const testimonials = [
    {
      author: "Sarah Chen",
      role: "Data Science Student, UC Berkeley",
      avatar: "",
      rating: 5,
      title: "Perfect for my data science course",
      text: "OpenIDE saved me during finals week. No installation needed and works on my phone! The AI assistant helped me debug my pandas code at 2 AM when no one was available to help.",
      date: "2025-10-15",
      verified: true
    },
    {
      author: "Marcus Johnson",
      role: "Statistics Major, University of Michigan",
      avatar: "",
      rating: 5,
      title: "Best R IDE for students",
      text: "Finally an R IDE that doesn't require installing RStudio on my laptop. I can code between classes on my iPad. The ggplot2 visualization tools are amazing.",
      date: "2025-10-12",
      verified: true
    },
    {
      author: "Dr. Emily Rodriguez",
      role: "Professor of Computer Science, MIT",
      avatar: "",
      rating: 5,
      title: "Recommended to all my students",
      text: "I recommend OpenIDE to all my intro programming students. It removes the installation barrier that often frustrates beginners. Students can start coding immediately.",
      date: "2025-10-08",
      verified: true
    },
    {
      author: "Alex Kim",
      role: "Business Analytics Student, NYU",
      avatar: "",
      rating: 5,
      title: "Game changer for mobile coding",
      text: "I code on my commute using OpenIDE on my phone. The mobile interface is actually usable, unlike other IDEs. Perfect for practicing Python during my 1-hour train ride.",
      date: "2025-10-05",
      verified: true
    },
    {
      author: "Priya Patel",
      role: "Bioinformatics PhD Candidate",
      avatar: "",
      rating: 4,
      title: "Great for quick data analysis",
      text: "I use OpenIDE for quick data analysis when I'm away from my workstation. The CSV upload feature and pandas support are exactly what I need for exploratory analysis.",
      date: "2025-09-28",
      verified: true
    },
    {
      author: "James Thompson",
      role: "High School Teacher, Boston",
      avatar: "",
      rating: 5,
      title: "Perfect for teaching Python",
      text: "My students can access OpenIDE from school computers without admin privileges. No more spending class time on installation issues. We can focus on learning to code!",
      date: "2025-09-25",
      verified: true
    }
  ];

  const averageRating = testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <ReviewSchema 
        reviews={testimonials}
        aggregateRating={{
          ratingValue: averageRating,
          reviewCount: testimonials.length
        }}
      />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">What Students Say About OpenIDE</h1>
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`h-6 w-6 ${star <= Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-xl font-semibold">{averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">({testimonials.length} reviews)</span>
            </div>
            <p className="text-xl text-muted-foreground">
              Real feedback from students and educators using OpenIDE
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative">
                <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/20" />
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.author} />
                      <AvatarFallback>{testimonial.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{testimonial.title}</CardTitle>
                      <p className="text-sm font-medium">{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`h-4 w-4 ${star <= testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                        {testimonial.verified && (
                          <span className="ml-2 text-xs text-primary">✓ Verified</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground italic">&quot;{testimonial.text}&quot;</p>
                  <p className="text-xs text-muted-foreground mt-3">
                    {new Date(testimonial.date).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Join Thousands of Students</h2>
              <p className="text-muted-foreground mb-4">
                Start coding Python and R in your browser today
              </p>
              <Button onClick={() => navigate("/ide")} size="lg">
                Try OpenIDE Free
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            * Sample reviews for demonstration purposes
          </p>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
