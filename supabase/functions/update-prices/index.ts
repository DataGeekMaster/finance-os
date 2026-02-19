// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

interface Asset {
  id: string;
  ticker: string;
  user_id?: string | null;
}

interface QuoteResult {
  regularMarketPrice: number | undefined;
  symbol: string;
}

const IDX_MARKET_HOURS = {
  monday: {
    morning: { start: 2, end: 5 },
    afternoon: { start: 6.5, end: 9.5 },
  },
  tuesday: {
    morning: { start: 2, end: 5 },
    afternoon: { start: 6.5, end: 9.5 },
  },
  wednesday: {
    morning: { start: 2, end: 5 },
    afternoon: { start: 6.5, end: 9.5 },
  },
  thursday: {
    morning: { start: 2, end: 5 },
    afternoon: { start: 6.5, end: 9.5 },
  },
  friday: {
    morning: { start: 2, end: 4.5 },
    afternoon: { start: 7, end: 9.5 },
  },
};

function isMarketOpen(): boolean {
  const now = new Date();
  const day = now.getUTCDay();
  const hour = now.getUTCHours() + now.getUTCMinutes() / 60;

  if (day === 0 || day === 6) return false;

  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayKey = days[day] as keyof typeof IDX_MARKET_HOURS;
  const schedule = IDX_MARKET_HOURS[dayKey];

  return (hour >= schedule.morning.start && hour < schedule.morning.end) ||
    (hour >= schedule.afternoon.start && hour < schedule.afternoon.end);
}

// FIX 4: Gunakan underscore (_req) karena variabel request tidak dipakai
Deno.serve(async (_req) => {
  try {
    if (!isMarketOpen()) {
      return new Response(
        JSON.stringify({ success: true, message: "Market closed" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

    const { data: assets, error: fetchError } = await supabase
      .from("assets")
      .select("id, ticker, user_id")
      .not("ticker", "is", null);

    if (fetchError || !assets || assets.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No assets" }),
        { status: 200 },
      );
    }

    const uniqueTickers = [...new Set(assets.map((a: Asset) => a.ticker))];
    const yahooTickers = uniqueTickers.map((t) => `${t}.JK`);

    // Fetch prices using Yahoo Finance API directly (more reliable than library)
    const quotes: QuoteResult[] = [];
    
    for (const ticker of yahooTickers) {
      try {
        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1d&interval=1d`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json',
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
          
          if (price) {
            quotes.push({
              symbol: ticker,
              regularMarketPrice: price,
            });
            console.log(`✅ Fetched ${ticker}: ${price}`);
          } else {
            console.warn(`⚠️ No price data for ${ticker}`);
          }
        } else {
          console.warn(`⚠️ Failed to fetch ${ticker}: ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ Error fetching ${ticker}:`, error);
      }
      
      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    let updatedCount = 0;

    for (const quote of quotes) {
      const originalTicker = quote.symbol.replace(".JK", "");
      const price = quote.regularMarketPrice;

      if (price) {
        const ids = assets.filter((a) => a.ticker === originalTicker).map((a) =>
          a.id
        );
        const { error: updErr } = await supabase
          .from("assets")
          .update({ current_price: price })
          .in("id", ids);

        if (!updErr) {
          updatedCount += ids.length;
          console.log(`✅ ${originalTicker} updated to ${price}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, updated: updatedCount }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err: unknown) {
    // FIX 5: Menangani tipe unknown pada error
    const errorMessage = err instanceof Error
      ? err.message
      : "An unknown error occurred";
    console.error("❌ Fatal Error:", err);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
