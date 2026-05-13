import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal, ThumbsUp, Send, Bookmark } from "lucide-react";
import { toast } from "sonner";

interface PlatformPreviewProps {
  content: string;
  userName: string;
  userHandle: string;
}

const PLATFORM_LIMITS = {
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
};

export const PlatformPreview = ({ content, userName, userHandle }: PlatformPreviewProps) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const copyToClipboard = (text: string, platform: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(platform);
    toast.success(`${platform} format copied!`);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  // Format for Twitter - handles threads
  const formatForTwitter = (text: string) => {
    const tweets: string[] = [];
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    paragraphs.forEach((paragraph, index) => {
      const prefix = paragraphs.length > 1 ? `${index + 1}/${paragraphs.length} ` : '';
      const availableSpace = PLATFORM_LIMITS.twitter - prefix.length;
      
      if (paragraph.length <= availableSpace) {
        tweets.push(prefix + paragraph);
      } else {
        // Split into multiple tweets if needed
        let remaining = paragraph;
        let partNum = 1;
        while (remaining.length > 0) {
          const prefix = paragraphs.length > 1 || partNum > 1 
            ? `${index + 1}/${paragraphs.length}${partNum > 1 ? ` (cont)` : ''} ` 
            : '';
          const available = PLATFORM_LIMITS.twitter - prefix.length;
          const chunk = remaining.slice(0, available);
          tweets.push(prefix + chunk);
          remaining = remaining.slice(available);
          partNum++;
        }
      }
    });
    
    return tweets;
  };

  // Format for LinkedIn - professional with emojis
  const formatForLinkedIn = (text: string) => {
    return text
      .replace(/\n\n/g, '\n\n') // Keep paragraphs
      .slice(0, PLATFORM_LIMITS.linkedin);
  };

  // Format for Instagram - hashtags at end
  const formatForInstagram = (text: string) => {
    const hashtags = '#contentcreator #personalbrand #indiancreator #growthmindset #contentstrategy';
    const mainText = text.slice(0, PLATFORM_LIMITS.instagram - hashtags.length - 5);
    return `${mainText}\n\n${hashtags}`;
  };

  const twitterTweets = formatForTwitter(content);
  const linkedInText = formatForLinkedIn(content);
  const instagramText = formatForInstagram(content);

  return (
    <div className="w-full">
      <Tabs defaultValue="twitter" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="twitter" className="flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Twitter/X
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            LinkedIn
          </TabsTrigger>
          <TabsTrigger value="instagram" className="flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            Instagram
          </TabsTrigger>
        </TabsList>

        {/* Twitter Preview */}
        <TabsContent value="twitter">
          <div className="border border-border rounded-lg overflow-hidden bg-background dark:bg-zinc-950">
            <div className="p-4 space-y-4">
              {twitterTweets.map((tweet, index) => (
                <div key={index} className="border-b border-border/50 last:border-0 pb-4 last:pb-0">
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                        {userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-bold text-sm truncate">{userName}</span>
                        <span className="text-muted-foreground text-sm">@{userHandle}</span>
                        <span className="text-muted-foreground text-sm">·</span>
                        <span className="text-muted-foreground text-sm">2m</span>
                      </div>
                      <p className="text-[15px] leading-normal whitespace-pre-wrap break-words">
                        {tweet}
                      </p>
                      {index === 0 && (
                        <div className="flex items-center gap-6 mt-3 text-muted-foreground">
                          <button className="flex items-center gap-2 hover:text-primary transition-colors text-sm">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-xs">12</span>
                          </button>
                          <button className="flex items-center gap-2 hover:text-green-500 transition-colors text-sm">
                            <Repeat2 className="h-4 w-4" />
                            <span className="text-xs">5</span>
                          </button>
                          <button className="flex items-center gap-2 hover:text-rose-500 transition-colors text-sm">
                            <Heart className="h-4 w-4" />
                            <span className="text-xs">48</span>
                          </button>
                          <button className="flex items-center gap-2 hover:text-primary transition-colors text-sm">
                            <Share className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border bg-muted/30 flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {twitterTweets.length > 1 ? `${twitterTweets.length} tweets` : 'Single tweet'}
                {twitterTweets[0]?.length > PLATFORM_LIMITS.twitter && ' · May be truncated'}
              </span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => copyToClipboard(twitterTweets.join('\n\n---\n\n'), 'Twitter')}
              >
                {copiedFormat === 'Twitter' ? 'Copied!' : 'Copy All'}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* LinkedIn Preview */}
        <TabsContent value="linkedin">
          <div className="border border-border rounded-lg overflow-hidden bg-background dark:bg-zinc-900">
            <div className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm hover:underline cursor-pointer">{userName}</h4>
                      <p className="text-xs text-muted-foreground">Content Creator | Personal Branding</p>
                      <p className="text-xs text-muted-foreground">1h · 🌐</p>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap mb-4">
                {linkedInText}
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between text-muted-foreground">
                  <button className="flex items-center gap-1.5 hover:text-primary transition-colors text-xs">
                    <ThumbsUp className="h-4 w-4" />
                    Like
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-primary transition-colors text-xs">
                    <MessageCircle className="h-4 w-4" />
                    Comment
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-primary transition-colors text-xs">
                    <Repeat2 className="h-4 w-4" />
                    Repost
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-primary transition-colors text-xs">
                    <Send className="h-4 w-4" />
                    Send
                  </button>
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-border bg-muted/30 flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {linkedInText.length}/{PLATFORM_LIMITS.linkedin} characters
              </span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => copyToClipboard(linkedInText, 'LinkedIn')}
              >
                {copiedFormat === 'LinkedIn' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Instagram Preview */}
        <TabsContent value="instagram">
          <div className="border border-border rounded-lg overflow-hidden bg-background dark:bg-zinc-950 max-w-md mx-auto">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-semibold">
                    {userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm">{userHandle}</span>
              </div>
              <MoreHorizontal className="h-5 w-5" />
            </div>
            <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
              <span className="text-6xl">📝</span>
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <Heart className="h-6 w-6" />
                  <MessageCircle className="h-6 w-6" />
                  <Send className="h-6 w-6" />
                </div>
                <Bookmark className="h-6 w-6" />
              </div>
              <div className="text-sm">
                <span className="font-semibold">{userHandle}</span>{' '}
                <span className="text-muted-foreground">and others</span>
              </div>
              <div className="text-sm mt-1">
                <span className="font-semibold">{userHandle}</span>{' '}
                <span className="whitespace-pre-wrap">{instagramText.slice(0, 150)}...</span>
                <button className="text-muted-foreground ml-1">more</button>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                View all 12 comments
              </div>
            </div>
            <div className="p-3 border-t border-border bg-muted/30 flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {instagramText.length}/{PLATFORM_LIMITS.instagram} characters
              </span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => copyToClipboard(instagramText, 'Instagram')}
              >
                {copiedFormat === 'Instagram' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
