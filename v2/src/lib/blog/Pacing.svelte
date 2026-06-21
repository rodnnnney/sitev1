<script lang="ts">
  import { onMount } from "svelte";
  import { Text, Page } from "../primitives";
  import { bucketURL } from "../consts";

  let formulaElement: HTMLDivElement;

  onMount(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
    script.onload = () => {
      const formula = (window as any).katex.renderToString(
        "\\text{Pacing} = 48 \\times \\frac{(\\text{Tm Poss} + \\text{Opp Poss})}{2 \\times (\\frac{\\text{Tm MP}}{5})}",
        {
          displayMode: true,
          throwOnError: false,
        },
      );
      formulaElement.innerHTML = formula;
    };
    document.head.appendChild(script);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
    document.head.appendChild(link);
  });
</script>

<Page title="Pace Factor" showTime>
  <div class="flex flex-col gap-8">
    <Text type="paragraph" size="md" color="black">
      In the following article, I will attempt to draw similarities between my
      change in environment from a quiet suburb in the capital of Canada to one
      of the most vibrant and fast-moving cities in the world, New York City.
    </Text>

    <img
      src="{bucketURL}/blog/aura.avif"
      alt="stats"
      class="w-full rounded-lg object-cover"
    />

    <Text type="paragraph" size="md" color="black">
      When I was a kid, I was obsessed with the NBA. I was a LeBron bandwagon
      fan growing up; watching him dominate on the Heat with Wade and Bosh was
      unlike anything I'd ever seen in my 8 years of existence. There was this
      particular stat that I thought was incredibly interesting: pace. This
      metric measures the number of possessions a team averages per 48-minute
      regulation game. This stat gives in-depth insights into the playing
      styles, both offensive and defensive systems of teams, and competitive
      advantages that stem far beyond the stat sheet. The formula for
      calculating pace is:
    </Text>

    <div
      class="my-4 overflow-x-auto rounded-lg border border-line bg-paper p-4"
    >
      <div bind:this={formulaElement}></div>
    </div>

    <Text type="paragraph" size="md" color="black">
      The way we interpret pace is straightforward. If a team has a Pace Factor
      of 100, their games typically feature 100 total possessions combined
      between both teams. The current NBA average is approximately 99.56
      possessions per 48 minutes across all teams. Teams with higher pace
      factors engage in more possessions per game, indicating faster-paced play,
      while lower pace factors suggest more deliberate, methodical approaches to
      offense and defense.
    </Text>

    <Text type="paragraph" size="md" color="black">
      By default, an easy takeaway would be simply the increased amount of shot
      opportunities. You can imagine Ottawa like an NBA team with a lower Pace
      Factor—a slower-paced team with a larger emphasis on half-court sets and
      high-efficiency plays (the San Antonio Spurs come to mind). Life is
      comfortable, low stress, livable wages, decently low crime, overall quiet
      and comfortable.
    </Text>

    <Text type="paragraph" size="md" color="black">
      When you contrast this to NYC, it's like a different planet. The pace in
      NYC is night and day compared to Ottawa. You are stepping onto a team with
      one of the top 5 Pace Factors across the whole league. On average,
      high-pace teams generate more possessions per game, creating additional
      opportunities to score. For example, the 2024-2025 Memphis Grizzlies led
      the NBA with 106.9 possessions per 48 minutes. This draws a direct
      correlation with their league-high 18.8 fastbreak points per game. This
      further enforces the connection between more possessions equating to more
      shot attempts, particularly in transition, where offensive efficiency
      peaks. This doesn't come without drawbacks: high tempo imposes physical
      strain not only on opponents but on the offensive team as well. In 2024,
      the Atlanta Hawks (3rd in pace) used their young roster's energy to
      fatigue older teams; this is evident in the average decline of 12.3% in
      fourth quarter shooting against them. However, this is true for the team
      applying the pressure as well. As a result of the fast-paced offense,
      increased turnover rates are a common side effect. The 2024 Washington
      Wizards (4th in pace) committed 15.8 turnovers per game (3rd most),
      drawing a strong connection to their 21-61 record (worst in the league).
    </Text>

    <img
      src="{bucketURL}/blog/stats.png"
      alt="stats"
      class="w-full rounded-lg object-cover"
    />

    <Text type="paragraph" size="md" color="black">
      If you take the stats at face value, the correlation between pace and win
      percentage in the 2024-2025 NBA season is weak. If you recall from high
      school, a correlation coefficient of ~0.33 (0 is no correlation, 1 is
      direct correlation) still implies teams that play fast—so fast pace alone
      isn't a reliable indicator of success.
    </Text>

    <Text type="paragraph" size="md" color="black">That's it?</Text>

    <Text type="paragraph" size="md" color="black">
      Well, in the name of confirmation bias, I will offer an alternative. I
      believe that a hybrid model that combines the pros and cons of playing
      fast and slow pace could be a practical compromise. For example, the
      Denver Nuggets ranked 1st in fastbreak points (18.8 ppg) while maintaining
      a moderate 98.8 pace (Jokic did this). They selectively pushed tempo after
      defensive rebounds, generating 23.4% of their offense in transition.
      Combined with a unicorn 7-footer in Jokic who has playmaking ability
      better than most Hall of Fame guards with lob threats, their offense can
      choose to be selective, tactical, and flexible in how they approach games.
    </Text>

    <Text type="paragraph" size="md" color="black">
      You must be thinking that I'm typing in circles, but there is a clear
      takeaway here. Having high pace is a <s>good</s> great thing; through sheer
      effort and grit, you are able to create more opportunities for yourself and
      your teammates. This is a lesson that can be applied much further than just
      the basketball court. This can be compared to joining an early-stage startup
      with a strong team. The environment is unlike any other; you are forced to
      learn and execute faster— this is equivalent to joining an NBA team like the
      Grizzlies with a much higher pace factor. However, pace factor is a double-edged
      sword: it tires both the offensive and defensive teams, and when tired, passes
      get lazier, shooting percentage falls, etc. The best teams in the NBA balance
      tempo; they see it as a tool and not a lifestyle. In select scenarios, against
      select teams, they turn things up a notch.
    </Text>

    <Text type="heading" size="2xl" color="black">Conclusion</Text>

    <Text type="paragraph" size="md" color="black">
      My personal takeaway would be that I would much rather play on a high pace
      team than a slow one. Both have their strengths and weaknesses, but I
      believe that it is much easier to learn to slow down than it is to learn
      to speed up. This is why cars are designed with 250km/h+ top speed limits
      when most of the time, you are cruising at about half that.
    </Text>
  </div>
</Page>
