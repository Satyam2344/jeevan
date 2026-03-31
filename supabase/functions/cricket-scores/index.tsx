const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ESPN public sports API - no API key needed
const ESPN_ENDPOINTS = [
  "https://site.api.espn.com/apis/site/v2/sports/cricket/8039/scoreboard",  // International
  "https://site.api.espn.com/apis/site/v2/sports/cricket/8048/scoreboard",  // IPL/T20 leagues
];

interface SimplifiedMatch {
  id: string;
  name: string;
  status: string;
  venue: string;
  teams: string[];
  score: { inning: string; r: number; w: number; o: number }[];
  matchStarted: boolean;
  matchEnded: boolean;
  matchType: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const allMatches: SimplifiedMatch[] = [];

    const responses = await Promise.allSettled(
      ESPN_ENDPOINTS.map(url => fetch(url))
    );

    for (const result of responses) {
      if (result.status !== 'fulfilled' || !result.value.ok) continue;

      const data = await result.value.json();
      const events = data.events || [];

      for (const event of events) {
        const teams: string[] = [];
        const score: { inning: string; r: number; w: number; o: number }[] = [];

        const competitions = event.competitions || [];
        const comp = competitions[0];
        if (!comp) continue;

        const competitors = comp.competitors || [];
        for (const c of competitors) {
          const teamName = c.team?.displayName || c.team?.shortDisplayName || 'Unknown';
          teams.push(teamName);

          if (c.score !== undefined) {
            const linescores = c.linescores || [];
            if (linescores.length > 0) {
              for (let i = 0; i < linescores.length; i++) {
                const ls = linescores[i];
                score.push({
                  inning: `${teamName} Inn ${i + 1}`,
                  r: ls.runs ?? parseInt(c.score) ?? 0,
                  w: ls.wickets ?? 0,
                  o: ls.overs ?? 0,
                });
              }
            } else {
              score.push({
                inning: teamName,
                r: parseInt(c.score) || 0,
                w: 0,
                o: 0,
              });
            }
          }
        }

        const state = event.status?.type?.state || '';
        const isLive = state === 'in' || state === 'live';
        const isComplete = state === 'post';

        allMatches.push({
          id: event.id?.toString() || Math.random().toString(),
          name: event.name || `${teams[0]} vs ${teams[1]}`,
          status: event.status?.type?.detail || event.status?.type?.shortDetail || state,
          venue: comp.venue?.fullName || comp.venue?.address?.city || '',
          teams,
          score,
          matchStarted: isLive || isComplete,
          matchEnded: isComplete,
          matchType: event.season?.slug || 'international',
        });
      }
    }

    return new Response(JSON.stringify({ status: 'success', data: allMatches }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Cricket scores error:', error);
    return new Response(JSON.stringify({ status: 'error', message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
