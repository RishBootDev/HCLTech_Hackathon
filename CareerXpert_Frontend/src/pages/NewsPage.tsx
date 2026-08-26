import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { satornApi, satornChatApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Newspaper,
  Loader2,
  TrendingUp,
  ShieldCheck,
  Flame,
  ExternalLink,
  Bookmark,
  Send,
  Bot,
  MessageSquare,
  Eye,
  RefreshCw,
  Tag,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { profileApi } from "@/lib/api";
import NewsAIPage from "./NewsAIPage";
import { Search } from "lucide-react";

const CATEGORIES = ["ALL", "TECHNOLOGY", "CAREER", "AI", "BUSINESS", "GENERAL"];

interface Article {
  id: number;
  title: string;
  summary?: string;
  synthesizedNarrative?: string;
  content?: string;
  originalContent?: string;
  sourceUrl?: string;
  author?: string;
  category?: string;
  credibilityScore?: number;
  viewCount?: number;
  publishedAt?: string;
  publishDate?: string;
  source?: string;
  verdict?: string;
  keyFindings?: string;
  trueClaims?: number;
  falseClaims?: number;
  unverifiableClaims?: number;
  claimsCount?: number;
  // Live News fields
  description?: string;
  url?: string;
  sourceName?: string;
}

interface ChatMsg {
  role: "user" | "bot";
  text: string;
  time: Date;
}

export default function NewsPage() {
  const { user, isLoggedIn } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [trending, setTrending] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("ALL");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [savedArticlesList, setSavedArticlesList] = useState<Article[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Article[]>([]);

  // Satorn Chat
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [profileId, setProfileId] = useState<number | null>(null);

  const [savedArticles, setSavedArticles] = useState<number[]>([]);
  const [view, setView] = useState<"feed" | "trending" | "saved" | "factchecker">("feed");
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [verifyUrl, setVerifyUrl] = useState("");
  const [verifyingUrl, setVerifyingUrl] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [liveArticles, setLiveArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (isLoggedIn && user) {
      profileApi.getByEmail(user.email)
        .then((p) => {
          const id = (p as any).id;
          setProfileId(id);
          fetchArticles(category, id);
        })
        .catch(() => {
          fetchArticles(category);
        });
    } else {
      fetchArticles(category);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchArticles = async (cat?: string, pId?: number) => {
    setLoading(true);
    const targetProfileId = pId || profileId;
    try {
      const data = cat && cat !== "ALL"
        ? await satornApi.getByCategory(cat, targetProfileId || undefined)
        : await satornApi.getAll(0, 20, undefined, targetProfileId || undefined);
      setArticles((data as unknown as Article[]) || []);
    } catch {
      toast({ title: "Error", description: "Could not load articles", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedArticles = async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const data = await satornApi.getSavedArticles(profileId);
      // Backend returns SavedArticle objects { id, article: { ... } }
      const formatted = (data as any[]).map(sa => sa.article as Article);
      setSavedArticlesList(formatted);
      setSavedArticles(formatted.map(a => a.id));
    } catch {
      toast({ title: "Error", description: "Could not load saved articles", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    try {
      const data = await satornApi.getTrending();
      setTrending((data as unknown as Article[]) || []);
    } catch { /* silent */ }
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setSearchQuery("");
    setLiveArticles([]);
    fetchArticles(cat, profileId || undefined);
  };

  const handleSaveArticle = async (id: number) => {
    if (!profileId) {
      toast({ title: "Login required", description: "Please log in to save articles.", variant: "destructive" });
      return;
    }
    try {
      await satornApi.saveArticle(id, profileId);
      setSavedArticles((prev) => [...prev, id]);
      toast({ title: "Saved!", description: "Article saved to your library." });
    } catch {
      toast({ title: "Error", description: "Could not save article.", variant: "destructive" });
    }
  };

  const handleViewArticle = async (article: Article) => {
    setSelectedArticle(article);
    setChatMessages([]);
    try {
      await satornApi.getById(article.id);
    } catch { /* silent */ }
  };

  const handleVerifyArticle = async (articleId: number) => {
    setVerifyingId(articleId);
    try {
      await satornApi.verifyArticle(articleId);
      toast({ title: "Verification Triggered!", description: "AI fact-check process started for this article." });
      await fetchArticles(category !== "ALL" ? category : undefined);
    } catch {
      toast({ title: "Error", description: "Could not trigger verification.", variant: "destructive" });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleQuickVerifyUrl = async () => {
    if (!verifyUrl.trim() || !profileId) return;
    setVerifyingUrl(true);
    try {
      await satornApi.quickVerifyUrl(profileId, verifyUrl);
      toast({ title: "URL Submitted!", description: "The URL is being analyzed. Results will appear in the feed." });
      setVerifyUrl("");
      // Refresh feed to show the new entry
      fetchArticles(category, profileId);
    } catch {
      toast({ title: "Error", description: "Could not verify URL.", variant: "destructive" });
    } finally {
      setVerifyingUrl(false);
    }
  };

  const handleLiveSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingLive(true);
    setView("feed");
    try {
      const res = await satornApi.getTopNews(searchQuery);
      if (res && res.data) {
        const results = res.data.map((a: any, index: number) => ({
          id: -(index + 1),
          title: a.title,
          summary: a.description,
          sourceUrl: a.url,
          source: a.sourceName,
          publishedAt: a.publishedAt,
          category: "LIVE",
          credibilityScore: 0
        }));
        setLiveArticles(results);
        setArticles(results);
      }
    } catch {
      toast({ title: "Search Error", description: "Could not fetch live news", variant: "destructive" });
    } finally {
      setIsSearchingLive(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !profileId) return;
    const userMsg: ChatMsg = { role: "user", text: chatInput, time: new Date() };
    setChatMessages((prev) => [...prev, userMsg]);
    const inputText = chatInput;
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await satornChatApi.chat(profileId, inputText, selectedArticle?.id);
      
      const botMsg: ChatMsg = {
        role: "bot",
        text: typeof res === "string" ? res : "I'm analyzing the news...",
        time: new Date(),
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch {
      setChatMessages((prev) => [...prev, {
        role: "bot",
        text: "Sorry, I'm having trouble connecting. Please try again.",
        time: new Date(),
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const credibilityColor = (score?: number) => {
    if (!score) return "text-gray-400";
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const displayArticles = 
    view === "trending" ? trending : 
    view === "saved" ? savedArticlesList : 
    articles;

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Newspaper className="w-8 h-8 text-primary" />
            AI-Verified News Feed
          </h1>
          <p className="text-muted-foreground font-medium mt-1 text-sm">
            Automated news generation with built-in AI fact-checking 
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { label: "Feed", value: "feed" as const, icon: Newspaper },
            { label: "Trending", value: "trending" as const, icon: Flame },
            { label: "Saved", value: "saved" as const, icon: Bookmark },
            { label: "Fact-Checker", value: "factchecker" as const, icon: ShieldCheck },
          ].map(({ label, value, icon: Icon }) => (
            <Button
              key={value}
              onClick={() => {
                setView(value);
                if (value === "saved") fetchSavedArticles();
              }}
              variant={view === value ? "default" : "outline"}
              className={`rounded-xl gap-2 font-bold ${view === value ? "brand-gradient text-white shadow-lg" : ""}`}
            >
              <Icon className="w-4 h-4" /> {label}
            </Button>
          ))}
          <Button
            variant="outline"
            className="rounded-xl gap-2 font-bold"
            onClick={() => fetchArticles(category !== "ALL" ? category : undefined)}
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
      </section>

      {view === "factchecker" ? (
        <NewsAIPage />
      ) : (
        <>
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 shadow-sm hover:scale-105 duration-300 ${
              category === cat
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                : "bg-white text-muted-foreground border-blue-100/50 hover:border-primary/40 hover:text-primary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLiveSearch()}
            placeholder="Search live news across the web (e.g. 'OpenAI', 'Tech layoffs')..."
            className="w-full bg-white border-2 border-blue-100/50 rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:border-primary/50 transition-all shadow-sm"
          />
        </div>
        <Button 
          onClick={handleLiveSearch} 
          disabled={isSearchingLive}
          className="rounded-xl px-6 font-bold brand-gradient text-white shadow-lg"
        >
          {isSearchingLive ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
          Live Search
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Articles Feed */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : displayArticles.length === 0 ? (
            <div className="h-64 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground">
              <Newspaper className="w-12 h-12 opacity-20 mb-3" />
              <p className="font-bold">No articles available yet</p>
              <p className="text-sm mt-1">AI news generator will populate this section</p>
            </div>
          ) : (
            <AnimatePresence>
              {displayArticles.map((article, i) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`glass-card rounded-2xl p-6 border-2 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 ${
                    selectedArticle?.id === article.id ? "border-primary/50 shadow-lg shadow-primary/10" : "border-blue-100/50"
                  }`}
                  onClick={() => handleViewArticle(article)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Category + Source */}
                      <div className="flex items-center gap-2 mb-2">
                        {article.category && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                            <Tag className="w-2.5 h-2.5" />
                            {article.category}
                          </span>
                        )}
                        {article.credibilityScore !== undefined && (
                          <span className={`text-[10px] font-black flex items-center gap-1 ${credibilityColor(article.credibilityScore)}`}>
                            <ShieldCheck className="w-3 h-3" />
                            {article.credibilityScore}% credible
                          </span>
                        )}
                        {article.verdict && (
                          <span className={`text-[10px] font-black flex items-center gap-1 px-2.5 py-0.5 rounded-full ${article.verdict === 'TRUE' ? 'bg-green-100 text-green-700' : article.verdict === 'FALSE' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {article.verdict}
                          </span>
                        )}
                        {article.viewCount !== undefined && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                            <Eye className="w-3 h-3" /> {article.viewCount}
                          </span>
                        )}
                      </div>

                      <h3 className="font-black text-base text-foreground group-hover:text-primary transition-colors leading-snug mb-2">
                        {article.title}
                      </h3>
                      {(article.synthesizedNarrative || article.summary) && (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                          {article.synthesizedNarrative || article.summary}
                        </p>
                      )}
                      
                      {selectedArticle?.id === article.id && article.keyFindings && (
                        <div className="mt-3 bg-muted/50 p-3 rounded-xl border border-border text-sm">
                          <p className="font-bold text-xs text-muted-foreground mb-1 uppercase tracking-wider">Key Findings</p>
                          <ul className="list-disc pl-4 space-y-1 text-muted-foreground/90">
                            {article.keyFindings.split('\\n').filter(Boolean).map((finding, idx) => (
                              <li key={idx}>{finding.replace(/^[*-]\\s*/, '')}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-3">
                        {article.author && (
                          <span className="text-xs text-muted-foreground font-medium">By {article.author}</span>
                        )}
                        {(article.publishedAt || article.publishDate) && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(article.publishedAt || article.publishDate || "").toLocaleDateString()}
                          </span>
                        )}
                        {article.claimsCount !== undefined && article.claimsCount > 0 && (
                          <span className="text-[10px] text-muted-foreground font-medium ml-auto bg-muted px-2 py-0.5 rounded-full">
                            {article.trueClaims || 0} True / {article.falseClaims || 0} False Claims
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`rounded-xl h-9 w-9 hover:bg-amber-50 hover:text-amber-500 transition-all hover:scale-110 duration-300 ${
                          savedArticles.includes(article.id) ? "text-amber-500 bg-amber-50" : "text-muted-foreground"
                        }`}
                        onClick={(e) => { e.stopPropagation(); handleSaveArticle(article.id); }}
                      >
                        <Bookmark className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Re-verify with AI"
                        className="rounded-xl h-9 w-9 hover:bg-blue-50 hover:text-blue-500 text-muted-foreground transition-all hover:scale-110 duration-300"
                        onClick={(e) => { e.stopPropagation(); handleVerifyArticle(article.id); }}
                        disabled={verifyingId === article.id}
                      >
                        {verifyingId === article.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      </Button>
                      {article.sourceUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl h-9 w-9 hover:bg-primary/5 hover:text-primary text-muted-foreground transition-all hover:scale-110 duration-300"
                          onClick={(e) => { e.stopPropagation(); window.open(article.sourceUrl, "_blank"); }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* AI Chat Sidebar */}
        <div className="flex flex-col gap-4">

          {/* Quick URL Verify */}
          {profileId && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 shadow-sm">
              <h4 className="font-black text-xs text-blue-800 uppercase tracking-widest mb-2 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Quick URL Verifier
              </h4>
              <div className="flex gap-2">
                <input
                  value={verifyUrl}
                  onChange={(e) => setVerifyUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  className="flex-1 bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
                />
                <Button
                  size="sm"
                  onClick={handleQuickVerifyUrl}
                  disabled={!verifyUrl.trim() || verifyingUrl}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3"
                >
                  {verifyingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Check"}
                </Button>
              </div>
            </div>
          )}

          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-foreground text-sm">AI News Tutor</h3>
                <p className="text-[10px] text-muted-foreground font-medium">Fact-checking · News analysis</p>
              </div>
              {selectedArticle && (
                <div className="ml-auto px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black max-w-[100px] truncate">
                  Context: Active
                </div>
              )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm font-bold text-muted-foreground">Ask me about any news article</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {selectedArticle ? `Analyzing: "${selectedArticle.title?.substring(0, 40)}..."` : "Click an article to set context"}
                  </p>
                  <div className="mt-4 space-y-2 w-full">
                    {["Is this news credible?", "Summarize key points", "What's the impact?"].map((q) => (
                      <button
                        key={q}
                        onClick={() => setChatInput(q)}
                        className="w-full text-left px-3 py-2 rounded-xl bg-muted/50 text-xs font-semibold text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-tr-none"
                        : "bg-muted text-foreground rounded-tl-none"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                  placeholder={profileId ? "Ask about news..." : "Login to chat"}
                  disabled={!profileId}
                  className="flex-1 bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm font-medium outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 transition-colors"
                />
                <Button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || chatLoading || !profileId}
                  className="rounded-xl w-10 h-10 p-0 brand-gradient shadow-md"
                >
                  <Send className="w-4 h-4 text-white" />
                </Button>
              </div>
            </div>
          </div>

          {/* Trending mini */}
          {trending.length > 0 && view !== "trending" && (
            <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
              <h4 className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-orange-500" /> Top Trending
              </h4>
              <div className="space-y-2">
                {trending.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleViewArticle(a)}
                    className="w-full text-left text-xs font-semibold text-foreground/80 hover:text-primary transition-colors line-clamp-2 leading-snug py-1.5 border-b border-border/50 last:border-0"
                  >
                    {a.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
