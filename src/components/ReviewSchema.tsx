interface Review {
  author: string;
  rating: number; // 1-5
  title: string;
  text: string;
  date: string;
  verified?: boolean;
}

interface ReviewSchemaProps {
  reviews: Review[];
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
    worstRating?: number;
  };
}

/**
 * Generates structured data for reviews and ratings
 * Helps Google display star ratings in search results
 */
export const ReviewSchema = ({ reviews, aggregateRating }: ReviewSchemaProps) => {
  const reviewSchema = reviews.map((review) => ({
    "@type": "Review",
    "author": {
      "@type": "Person",
      "name": review.author
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.rating,
      "bestRating": "5",
      "worstRating": "1"
    },
    "reviewBody": review.text,
    "datePublished": review.date,
    ...(review.verified && { "publisher": { "@type": "Organization", "name": "bIDE" } })
  }));

  const aggregateSchema = aggregateRating ? {
    "@type": "AggregateRating",
    "ratingValue": aggregateRating.ratingValue,
    "reviewCount": aggregateRating.reviewCount,
    "bestRating": aggregateRating.bestRating || 5,
    "worstRating": aggregateRating.worstRating || 1
  } : null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "bIDE",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any (Web-based)",
    ...(aggregateSchema && { "aggregateRating": aggregateSchema }),
    ...(reviews.length > 0 && { "review": reviewSchema })
  };

  return (
    <script 
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

/**
 * Example usage:
 * 
 * const sampleReviews = [
 *   {
 *     author: "Sarah Chen",
 *     rating: 5,
 *     title: "Perfect for my data science course",
 *     text: "bIDE saved me during finals week. No installation needed and works on my phone!",
 *     date: "2025-10-15",
 *     verified: true
 *   }
 * ];
 * 
 * <ReviewSchema 
 *   reviews={sampleReviews}
 *   aggregateRating={{ ratingValue: 4.8, reviewCount: 127 }}
 * />
 */
