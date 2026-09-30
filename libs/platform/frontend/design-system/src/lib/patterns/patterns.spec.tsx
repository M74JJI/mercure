import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { DataState } from './data-state';
import { MetricCard } from './metric-card';
import { PageLayout, PageLayoutActions, PageLayoutHeader, PageLayoutTitle } from './page-layout';
import { Section, SectionTitle } from './section';
import { StatusIndicator } from './status-indicator';

describe('application patterns', () => {
  it('renders stable page and section composition slots', () => {
    const markup = renderToStaticMarkup(
      <PageLayout width="wide">
        <PageLayoutHeader>
          <PageLayoutTitle>Inventory</PageLayoutTitle>
          <PageLayoutActions>Actions</PageLayoutActions>
        </PageLayoutHeader>
        <Section tone="elevated">
          <SectionTitle>Assets</SectionTitle>
        </Section>
      </PageLayout>,
    );

    expect(markup).toContain('data-slot="page-layout"');
    expect(markup).toContain('data-width="wide"');
    expect(markup).toContain('data-slot="section"');
    expect(markup).toContain('data-tone="elevated"');
  });

  it('exposes error and loading states through accessible semantics', () => {
    const errorMarkup = renderToStaticMarkup(
      <DataState variant="error" title="Service unavailable" />,
    );
    const loadingMarkup = renderToStaticMarkup(<DataState variant="loading" title="Loading" />);

    expect(errorMarkup).toContain('role="alert"');
    expect(errorMarkup).toContain('data-variant="error"');
    expect(loadingMarkup).toContain('role="status"');
    expect(loadingMarkup).toContain('aria-live="polite"');
  });

  it('keeps metric and status tone contracts visible in rendered output', () => {
    const markup = renderToStaticMarkup(
      <>
        <MetricCard tone="positive" label="Coverage" value="98%" />
        <StatusIndicator tone="warning">Review required</StatusIndicator>
      </>,
    );

    expect(markup).toContain('data-slot="metric-card"');
    expect(markup).toContain('Coverage');
    expect(markup).toContain('data-slot="status-indicator"');
    expect(markup).toContain('Review required');
  });
});
