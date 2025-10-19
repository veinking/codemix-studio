import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { updatePageSEO } from "@/utils/seo";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";

const BlogIndex = () => {
  const navigate = useNavigate();

  useEffect(() => {
    updatePageSEO({
      title: 'OpenIDE Blog | Python & R Tutorials, Data Science Tips',
      description: 'Learn Python, R, and data science with OpenIDE tutorials. Free coding guides, tips, and best practices for students. Updated weekly.',
      keywords: 'python tutorials, r programming tutorials, data science blog, coding tips for students, learn programming',
      canonical: 'https://codemixapp.com/blog'
    });
  }, []);

  const posts = [
    {
      title: "How to Run Python in Your Browser Without Installation",
      description: "Learn how WebAssembly makes it possible to run Python directly in your browser with OpenIDE. No downloads required.",
      date: "2025-10-15",
      readTime: "5 min",
      category: "Tutorial",
      slug: "run-python-browser-webassembly"
    },
    {
      title: "5 Data Science Projects You Can Build with OpenIDE",
      description: "Beginner-friendly data science projects using Python and pandas. Perfect for building your portfolio.",
      date: "2025-10-10",
      readTime: "8 min",
      category: "Projects",
      slug: "5-data-science-projects-openide"
    },
    {
      title: "OpenIDE vs Jupyter Notebook: Which is Better for Students?",
      description: "A detailed comparison of OpenIDE and Jupyter Notebook for student use cases. Find out which tool fits your needs.",
      date: "2025-10-05",
      readTime: "6 min",
      category: "Comparison",
      slug: "openide-vs-jupyter-notebook"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://codemixapp.com/" },
        { name: "Blog", url: "https://codemixapp.com/blog" }
      ]} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">OpenIDE Blog</h1>
            <p className="text-xl text-muted-foreground">
              Python, R, and data science tutorials for students
            </p>
          </div>

          <div className="space-y-6">
            {posts.map((post) => (
              <Card 
                key={post.slug}
                className="hover:border-primary transition-colors cursor-pointer"
                onClick={() => navigate(`/blog/${post.slug}`)}
              >
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{post.category}</Badge>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(post.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.readTime}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-2xl hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {post.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                More articles coming soon! Follow us for updates on Python, R, and data science tutorials.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BlogIndex;
