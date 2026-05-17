import { Switch, Route } from "wouter";
import { Suspense, lazy } from "react";

const BusinessPage = lazy(() => import("@/pages/BusinessPage"));
const BookingFlow  = lazy(() => import("@/pages/BookingFlow"));

function Loader() {
  return (
    <div className="min-h-dvh flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--p-soft)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: "var(--p)" }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full animate-bounce"
              style={{ background: "var(--p)", animationDelay: `${i*0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Switch>
        <Route path="/business/:slug">
          {({ slug }) => <BusinessPage slug={slug!} />}
        </Route>
        <Route path="/book/:id" component={BookingFlow} />
        <Route path="/">
          {/* Default: redirect to demo business */}
          <BusinessPage slug="demo" />
        </Route>
      </Switch>
    </Suspense>
  );
}
