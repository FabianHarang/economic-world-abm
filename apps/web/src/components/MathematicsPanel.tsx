import type { CounterfactualExperimentResult, SimulationResult } from "@world-abm/core";

interface MathematicsPanelProps {
  readonly result: SimulationResult;
  readonly experiment: CounterfactualExperimentResult;
}

interface EquationItem {
  readonly title: string;
  readonly body: string;
}

const notationRows = [
  ["N", "Households", "Explicit household agents"],
  ["F", "Firms", "Explicit firm agents"],
  ["B", "Banks", "Credit intermediaries"],
  ["S", "Sectors", "Price-index and production-network groups"],
  ["T", "Periods", "Monthly model steps"],
  ["d", "Supplier degree", "Incoming suppliers per buyer firm"],
  ["E", "Supplier edges", "Sparse directed buyer-supplier links"]
] as const;

const stateBlocks = [
  {
    title: "Household state",
    body: String.raw`\[
x^H_{h,t}
=
\left(
e_{h,t}, w_{h,t}, \ell_{h,t}, D_{h,t}, Q_{h,t},
M_{h,t}, V^H_{h,t}, \nu_h, A^E_{h,t},
\bar c_{h,t}, \pi^e_{h,t}, b_{h,t}, r^e_{h,t}, \beta_h
\right).
\]

\[
h=1,\ldots,N,\quad
e_{h,t}\in\{-1,0,\ldots,F-1\},\quad
b_{h,t}\in\{\mathrm{HTM},\mathrm{LB},\mathrm{HAB},\mathrm{DS}\}.
\]`
  },
  {
    title: "Firm state",
    body: String.raw`\[
x^F_{f,t}
=
\left(
s_f,g_f,\beta_f,P_{f,t},z_f,K_f,L_{f,t},L^0_f,
W_{f,t},Y_{f,t},X_{f,t},Q^F_{f,t},V^F_{f,t},
I^G_{f,t},I^M_{f,t},\bar I^M_f,B^M_{f,t},
\rho_{f,t},\kappa_f,\mu_f,\chi_f,\delta^F_{f,t}
\right).
\]

\[
f=1,\ldots,F,\quad s_f\in\{1,\ldots,S\},\quad
\beta_f\in\{1,\ldots,B\}.
\]`
  },
  {
    title: "Bank and network state",
    body: String.raw`\[
x^B_{b,t}=(K^B_{b,t},M^B_{b,t},Q^B_{b,t},\tau_{b,t}),
\quad b=1,\ldots,B.
\]

\[
G_t=(V,E_t,W),\quad |V|=F,\quad |E_t|=F d,\quad
\sum_{j:(j,f)\in E_t}\omega_{jf}=1.
\]`
  }
] as const;

const timingSteps = [
  "Draw policy and credit rates.",
  "Update mortgage rates and household cash flow.",
  "Update household expectations, consumption, deposits, debt, and portfolios.",
  "Attempt supplier deliveries and optionally rewire failed links.",
  "Update labor demand, wage offers, hires, and layoffs.",
  "Update firm production, prices, cash, debt, and defaults.",
  "Update housing, equity, bank credit tightness, and aggregate indexes."
] as const;

const equationSections: Array<{
  readonly title: string;
  readonly note: string;
  readonly equations: readonly EquationItem[];
}> = [
  {
    title: "Policy Rate and Mortgage Pass-Through",
    note:
      "Rates are annualized, while the simulator advances in monthly periods. The treatment is an exogenous temporary policy-rate shock.",
    equations: [
      {
        title: "Policy path",
        body: String.raw`\[
i_t
=
i_0
+
\Delta i\,
\mathbf 1\{t_0\le t<t_0+D_i\},
\qquad
\delta_t=\max(0,i_t-i_0).
\]

\[
\ell_t=i_t+0.018+0.004\sin(t/9).
\]`
      },
      {
        title: "Mortgage rates",
        body: String.raw`\[
r^V_t=i_t+\mathrm{spread}+0.006\,\bar\tau_{t-1}.
\]

\[
r^F_t=(1-\lambda_F)r^F_{t-1}+\lambda_F r^V_t.
\]

\[
r^M_{h,t}=\nu_h r^V_t+(1-\nu_h)r^F_t,\qquad
\bar r^M_t=\sum_h \frac{M_{h,t}}{\sum_j M_{j,t}}r^M_{h,t}.
\]`
      }
    ]
  },
  {
    title: "Households: Expectations, Budgets, and Consumption",
    note:
      "Households differ by behavior rule, expectation rule, employer, mortgage exposure, deposits, debt, housing, and equity holdings.",
    equations: [
      {
        title: "Expectation rules",
        body: String.raw`\[
\pi^e_{h,t+1}=
\begin{cases}
0.68\pi^e_{h,t}+0.32\pi_t, & r^e_h=\mathrm{adaptive},\\
\gamma\pi^\star+(1-\gamma)(0.72\pi^e_{h,t}+0.28\pi_t), & r^e_h=\mathrm{anchored},\\
\pi_t+0.32(\pi_t-\pi^e_{h,t}), & r^e_h=\mathrm{extrapolative},\\
0.62\pi^e_{h,t}+0.28\pi_t+0.05(P_{e_h,t}-1)+0.025(C_t-1),
& r^e_h=\mathrm{employer}.
\end{cases}
\]

\[
\pi^e_{h,t+1}\leftarrow \mathrm{clip}(\pi^e_{h,t+1},-0.05,0.18).
\]`
      },
      {
        title: "Household cash-on-hand",
        body: String.raw`\[
y_{h,t}=
\mathbf 1\{e_{h,t}\ge 0\}\,w_{h,t}\ell_{h,t}
+
\mathbf 1\{e_{h,t}<0\}\,0.26\bar c_{h,t}.
\]

\[
\mathrm{ds}_{h,t}
=
Q_{h,t}\left(\frac{\ell_t}{12}+0.004\right)
+
M_{h,t}\left(\frac{r^M_{h,t}}{12}+0.0028\right).
\]

\[
a_{h,t}
=
D_{h,t}+y_{h,t}
D_{h,t}\frac{\max(0,i_t-0.012)}{12}
\mathrm{draw}_{h,t}
-\mathrm{ds}_{h,t}.
\]`
      },
      {
        title: "Rule-based consumption and balance sheet update",
        body: String.raw`\[
c_{h,t}
=
\mathrm{clip}
\left(
g_{b_{h,t}}(a_{h,t},D_{h,t},Q_{h,t},\bar c_{h,t},\pi^e_{h,t},
\mathrm{DSR}_{h,t},\mathrm{wealth}_{h,t},\mathrm{collateral}_{h,t}),
0,\max(0,a_{h,t})
\right).
\]

\[
D_{h,t+1}=\max(0,a_{h,t}-c_{h,t}),\quad
Q_{h,t+1}=\max(0,Q_{h,t}-0.004Q_{h,t}).
\]

\[
M_{h,t+1}=\max(0,M_{h,t}+\mathrm{draw}_{h,t}-0.0028M_{h,t}),\quad
\bar c_{h,t+1}=0.88\bar c_{h,t}+0.12c_{h,t}.
\]`
      },
      {
        title: "Behavior-rule kernels",
        body: String.raw`\[
g_{\mathrm{HTM}}=a\,\mathrm{clip}(0.90+0.70\pi^e,0.78,0.97)\,A_h.
\]

\[
g_{\mathrm{LB}}=a\,\mathrm{clip}(0.68-0.22\,\mathrm{bufferGap}-0.35\pi^e,0.36,0.78)\,A_h.
\]

\[
g_{\mathrm{HAB}}=\mathrm{clip}\left(\bar c(0.92+0.80\pi^e)A_h,0.35a,0.90a\right).
\]

\[
g_{\mathrm{DS}}=a\,\mathrm{clip}(0.74-\xi\,\mathrm{DSR}-\mathrm{debtStress}-0.16\,\mathrm{collateral},0.28,0.78)
\mathrm{clip}(1+0.4\,\mathrm{wealth},0.88,1.08).
\]`
      }
    ]
  },
  {
    title: "Labor Market and Wage Offers",
    note:
      "Firms target labor from demand, policy-rate stress, construction demand, and their working-capital exposure. Matching frictions prevent all vacancies from being filled.",
    equations: [
      {
        title: "Desired labor",
        body: String.raw`\[
D^C_t=\mathrm{clip}(C_t,0.65,1.35).
\]

\[
\psi_f=0.25+0.08g_f+0.18\chi_f.
\]

\[
\widehat D_{f,t}
=
0.78+0.28D^C_t+\mathrm{construction}_{f,t}
-2.8\,\delta_t\psi_f+\varepsilon_{f,t}.
\]

\[
L^\star_{f,t}
=
\max\left(1,\mathrm{round}\left(L^0_f\,\mathrm{clip}(\widehat D_{f,t},0.55,1.45)\right)\right).
\]`
      },
      {
        title: "Wage offers and matching",
        body: String.raw`\[
W_{f,t+1}
=
W_{f,t}\,
\mathrm{clip}
\left(
1+\frac{\eta_w\bar\pi^e_t+0.015(0.08-U^{pool}_t/N)}{12},
0.985,1.035
\right).
\]

\[
\mathrm{vac}_{f,t}=\max(0,L^\star_{f,t}-L_{f,t}),\quad
\mathrm{hires}_{f,t}\le (1-\varphi_m)\mathrm{vac}_{f,t}.
\]

\[
\mathrm{layoffs}_{f,t}
=
\left\lceil(1-\varphi_f)\max(0,L_{f,t}-L^\star_{f,t})\right\rceil.
\]`
      }
    ]
  },
  {
    title: "Supplier Network and Input Availability",
    note:
      "Each firm has a sparse upstream supplier set. Failed deliveries create backlogs; some failed edges are rewired to replacement suppliers.",
    equations: [
      {
        title: "Orders and delivery failures",
        body: String.raw`\[
O_{f,t}
=
\max\left(0,\bar I^M_f-I^M_{f,t}+0.35B^M_{f,t}\right).
\]

\[
p^{fail}_{jf,t}
=
\mathrm{clip}
\left(
0.012+\theta_d\,\mathrm{fragility}_{j,t}
 +2.4\theta_d\delta_t
 +0.025\max(0,1-C_t),
0.004,0.55
\right).
\]

\[
\Pr(\mathrm{delivery}_{jf,t}=0)=
\mathbf 1\{\delta^F_{j,t}=1\}
+(1-\mathbf 1\{\delta^F_{j,t}=1\})p^{fail}_{jf,t}.
\]`
      },
      {
        title: "Input availability",
        body: String.raw`\[
I^M_{f,t+1}=\mathrm{clip}\left(I^M_{f,t}+\sum_{j:(j,f)\in E_t}\omega_{jf}O_{f,t}\mathbf 1_{jf,t}^{delivered},0,3\bar I^M_f\right).
\]

\[
B^M_{f,t+1}
=
\begin{cases}
0.90B^M_{f,t}, & a^M_{f,t}>0.90,\\
0.985B^M_{f,t}, & a^M_{f,t}\le 0.90,
\end{cases}
\quad\text{plus failed-order increments.}
\]

\[
a^M_{f,t}
=
\mathrm{clip}
\left(
0.48+0.52\frac{I^M_{f,t}}{\bar I^M_f}
-0.18\frac{B^M_{f,t}}{\bar I^M_f}
+0.12\sigma_M,
0.35,1.16
\right).
\]`
      }
    ]
  },
  {
    title: "Firms: Production, Pricing, Finance, and Default",
    note:
      "Firms produce with labor, capital, productivity, demand, and input bottlenecks. Prices move gradually according to cost, demand, backlog, and financing pressure.",
    equations: [
      {
        title: "Production",
        body: String.raw`\[
\tilde Y_{f,t}
=
z_f(L_{f,t}+1)^{0.62}K_f^{0.28}D^Y_{f,t}.
\]

\[
m_{f,t}=\tilde Y_{f,t}\alpha^M_f,\quad
u^M_{f,t}=\min(I^M_{f,t},m_{f,t}),\quad
bottleneck_{f,t}=\frac{u^M_{f,t}}{m_{f,t}}.
\]

\[
Y_{f,t}
=
\tilde Y_{f,t}\,
\mathrm{clip}\left(0.58+0.42\,bottleneck_{f,t}-0.08\max(0,\mathrm{inputStress}_{f,t}),0.42,1.04\right).
\]`
      },
      {
        title: "Price adjustment",
        body: String.raw`\[
\Delta p^\star_{f,t}
=
0.0011+\mathrm{markupPressure}_{f}
(0.8+\chi_c)\mathrm{marginalCostPressure}_{f,t}
0.008\,\mathrm{laborDemandPressure}_{f,t}
0.012(C_t-1)
0.010\,\mathrm{backlogStress}_{f,t}
0.055\,\delta_t\chi_c\chi_f.
\]

\[
P_{f,t+1}
=
P_{f,t}\,
\mathrm{clip}\left(1+(1-\kappa_f)\Delta p^\star_{f,t},0.965,1.055\right).
\]`
      },
      {
        title: "Cash, debt, and default",
        body: String.raw`\[
R_{f,t}=100P_{f,t}Y_{f,t}.
\]

\[
X_{f,t+1}=X_{f,t}+R_{f,t}-WBill_{f,t}-InputCost_{f,t}-WorkingCapitalCost_{f,t}.
\]

\[
Q^F_{f,t+1}=Q^F_{f,t}+
\max\left(0,WCNeed_{f,t}\mathrm{clip}(0.14-0.08\tau_{\beta_f,t},0.04,0.14)-0.05X_{f,t}\right).
\]

\[
\delta^F_{f,t+1}=1
\quad\text{if}\quad
X_{f,t+1}<-25000
\quad\text{or}\quad
\frac{Q^F_{f,t+1}}{\max(1,X_{f,t+1}+R_{f,t})}>14.
\]`
      }
    ]
  },
  {
    title: "Assets, Banks, and Aggregates",
    note:
      "Housing and equity prices feed household wealth and collateral. Bank tightness is recomputed from mortgage stress, firm-loan stress, and capital ratios.",
    equations: [
      {
        title: "Housing and construction",
        body: String.raw`\[
H_{t+1}=H_t\,\mathrm{clip}(1+\Delta H_t,0.955,1.045).
\]

\[
\Delta H_t
=
0.0012+0.020(C_t-1)
 +(0.012+0.018\epsilon_H)(1-Y^{constr}_t/100)
 +0.006(0.22-\bar\tau_t)
 -0.08\max(0,\bar r^M_t-i_0-0.012)
 -0.16\delta_t.
\]

\[
D^{constr}_{t+1}
=
\mathrm{clip}\left(1+0.36(H_{t+1}-1)-2.4\max(0,\bar r^M_t-i_0-0.01)-0.28\bar\tau_t+0.22(C_t-1),0.55,1.45\right).
\]`
      },
      {
        title: "Bank tightness",
        body: String.raw`\[
A^B_{b,t}=M^B_{b,t}+Q^B_{b,t},\qquad
K^B_{b,t}=0.082A^B_{b,t}+4000+375(b\bmod 5).
\]

\[
\mathrm{mortStress}_{b,t}
=
\frac{1}{N_b}\sum_{h:\beta_h=b}\mathrm{clip}\left(\frac{M_{h,t}/V^H_{h,t}-0.72}{0.28},0,1.8\right).
\]

\[
\tau_{b,t}
=
\mathrm{clip}\left(
0.11+0.46\,\mathrm{mortStress}_{b,t}
0.12\,\mathrm{firmStress}_{b,t}
3.2\max\left(0,0.085-\frac{K^B_{b,t}}{A^B_{b,t}}\right),
0.04,0.72
\right).
\]`
      },
      {
        title: "Inflation, output, unemployment, and counterfactual effects",
        body: String.raw`\[
CPI_t=\sum_{s=1}^{S}\omega_s\left(\frac{1}{|F_s|}\sum_{f:s_f=s}P_{f,t}\right),
\qquad
\pi_t=12\log(CPI_t/CPI_{t-1}).
\]

\[
Y^{index}_t
=
100\frac{\sum_f Y_{f,t}}{\sum_f Y^0_f},
\qquad
u_t=1-\frac{|\{h:e_{h,t}\ge 0\}|}{N}.
\]

\[
\Delta z_t=z^{treatment}_t-z^{baseline}_t
\quad\text{using identical population, network, and random seeds.}
\]`
      }
    ]
  }
];

export function MathematicsPanel({ result, experiment }: MathematicsPanelProps) {
  const scale = result.metadata.scale;
  const supplierDegree = scale.supplierEdges / Math.max(1, scale.firms);

  return (
    <section className="math-panel" aria-label="Mathematical specification">
      <header className="math-hero">
        <div>
          <p className="amor-kicker">Mathematical specification</p>
          <h3>Actual dynamics used in the browser simulation</h3>
          <p>
            This is a readable mathematical map of the TypeScript simulation. It is intentionally written in LaTeX
            notation so the same blocks can later move into technical documentation or a formal model appendix.
          </p>
        </div>
        <dl className="math-meta">
          <div>
            <dt>Households</dt>
            <dd>{scale.households.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Firms</dt>
            <dd>{scale.firms.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Periods</dt>
            <dd>{scale.periods.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Runs</dt>
            <dd>{experiment.summary.seedCount * 2}</dd>
          </div>
        </dl>
      </header>

      <div className="math-dimension-grid">
        {notationRows.map(([symbol, meaning, description]) => (
          <article key={symbol}>
            <span>{symbol}</span>
            <strong>{meaning}</strong>
            <p>{description}</p>
          </article>
        ))}
      </div>

      <section className="math-scale-callout">
        <div>
          <p className="amor-kicker">Current browser dimensions</p>
          <h4>
            \(N={scale.households.toLocaleString()}\), \(F={scale.firms.toLocaleString()}\), \(B=
            {scale.banks.toLocaleString()}\), \(S={scale.sectors.toLocaleString()}\), \(T=
            {scale.periods.toLocaleString()}\)
          </h4>
          <p>
            The sparse supplier network has \(E={scale.supplierEdges.toLocaleString()}\) directed edges, so the current
            average incoming supplier degree is \(d={supplierDegree.toFixed(1)}\). The displayed counterfactual uses{" "}
            {experiment.summary.seedCount.toLocaleString()} paired seeds, meaning baseline and treatment are both run
            for each seed.
          </p>
        </div>
        <EquationBlock
          title="Scale identity"
          body={`\\[
|E|=F d
=
${scale.firms}\\times ${supplierDegree.toFixed(1)}
=
${scale.supplierEdges}.
\\]

\\[
\\mathrm{browser\\ run}=(N,F,B,S,T,E)=(100000,1000,25,20,96,5000).
\\]`}
        />
      </section>

      <section className="math-section">
        <div className="math-section-heading">
          <p className="amor-kicker">State variables</p>
          <h4>Agent state carried through time</h4>
          <p>
            The model is not a representative-agent system. It stores explicit household and firm arrays, a sparse
            directed supplier graph, bank balance-sheet aggregates, and aggregate indexes derived from micro states.
          </p>
        </div>
        <div className="math-equation-grid">
          {stateBlocks.map((block) => (
            <EquationBlock key={block.title} title={block.title} body={block.body} />
          ))}
        </div>
      </section>

      <section className="math-section">
        <div className="math-section-heading">
          <p className="amor-kicker">Timing</p>
          <h4>Within-period update order</h4>
          <p>
            Each monthly step is sequential. This matters because households consume before firms price, supplier
            failures affect production in the same period, and bank tightness feeds the next mortgage and credit step.
          </p>
        </div>
        <ol className="math-timing-list">
          {timingSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      {equationSections.map((section) => (
        <section className="math-section" key={section.title}>
          <div className="math-section-heading">
            <p className="amor-kicker">Dynamics</p>
            <h4>{section.title}</h4>
            <p>{section.note}</p>
          </div>
          <div className="math-equation-grid">
            {section.equations.map((equation) => (
              <EquationBlock key={equation.title} title={equation.title} body={equation.body} />
            ))}
          </div>
        </section>
      ))}

      <section className="math-assumption-grid" aria-label="Model assumptions">
        <article>
          <span>Clipping</span>
          <p>
            Many transitions use {"\\(\\mathrm{clip}(x,a,b)\\)"}. This keeps the browser model numerically stable, but
            it also means tail behavior is stylized until calibrated sensitivity sweeps are added.
          </p>
        </article>
        <article>
          <span>Monthly time</span>
          <p>
            Rates and inflation are annualized in reporting, while household budgets, deliveries, labor changes, and
            pricing update once per monthly period.
          </p>
        </article>
        <article>
          <span>Seeded stochasticity</span>
          <p>
            The same seeds generate matched baseline and treatment economies. Counterfactual differences therefore
            isolate the regime path from population and network redraws.
          </p>
        </article>
        <article>
          <span>Stylized calibration</span>
          <p>
            Coefficients are currently engineering assumptions for a working data lab. Norway/EU data calibration must
            replace them before outputs should be interpreted as empirical claims.
          </p>
        </article>
      </section>
    </section>
  );
}

function EquationBlock({ title, body }: EquationItem) {
  return (
    <article className="equation-card">
      <h5>{title}</h5>
      <pre aria-label={`${title} LaTeX equation`}>
        <code>{body}</code>
      </pre>
    </article>
  );
}
