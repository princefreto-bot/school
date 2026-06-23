import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export const initOpenTelemetry = () => {
  // Exportateur OTLP (ex: Jaeger, SigNoz, Datadog)
  const exporter = new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces', // URL de l'agent OTLP
  });

  const provider = new WebTracerProvider({
    resource: resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: 'dghubschool-frontend',
    }),
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });
  
  provider.register({
    contextManager: new ZoneContextManager(),
  });

  // Instrumentation automatique (Fetch, XHR, Document Load, etc.)
  registerInstrumentations({
    instrumentations: [
      getWebAutoInstrumentations({
        '@opentelemetry/instrumentation-fetch': {
          clearTimingResources: true,
        },
      }),
    ],
  });

  console.log('OpenTelemetry initialisé.');
};
