import { Card } from '@/components/ui/card';

type Props = {
  code: string;
  image_url: string; // Changed from imageUrl to image_url
};

export default function ComponentPreview({ code, image_url }: Props) {
  return (
    <Card className="w-full overflow-hidden">
      <div className="aspect-video relative">
        <img 
          src={image_url} 
          alt="Component preview"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/150?text=Preview+Not+Available';
          }}
        />
      </div>
      <div className="p-4 bg-muted/50">
        <pre className="text-xs overflow-x-auto">
          <code>{code}</code>
        </pre>
      </div>
    </Card>
  );
}