# IT-ERA Development Rules

## Brand Guidelines
- Always use "IT-ERA" (all caps with hyphen) for company name
- Primary color: #0056cc (IT Blue)
- Secondary color: #dc3545 (Security Red)
- Emergency phone: **039 888 2041** must be prominently displayed
- Response time guarantee: **15 minuti garantiti**

## Content Guidelines
- Professional Italian business tone
- Emergency situations require immediate phone contact visibility
- Include Lombardy region keywords for SEO
- Mention specific cities: Milano, Bergamo, Brescia, Como, etc.

## Technical Standards
- Mobile-first responsive design
- Accessibility compliance (WCAG 2.1)
- Performance optimization (Lighthouse score >90)
- SEO optimization for local search
- GDPR compliance for medical/legal sectors

## AI Integration Rules
- Integrate with existing OpenAI GPT-4 system in `web/js/ai-config.js`
- Enhance Tawk.to chatbot with AI processing
- Maintain conversation history and context
- Detect urgency and route to emergency contact
- Sector-specific responses (medical, legal, general)

## Code Patterns
- Use existing ITERAIConfig class for AI configuration
- Follow ITERASmartChatbot pattern for chat integration
- Maintain existing CSS component structure
- Use Bootstrap classes for consistency
- Follow existing JavaScript ES6+ patterns

## Testing Requirements
- All new features must have Jest unit tests
- E2E tests with Playwright for critical paths
- Lighthouse performance testing
- Cross-browser compatibility testing
- Mobile device testing

## Deployment Rules
- Use Cloudflare Pages for static hosting
- Cloudflare Workers for API endpoints
- Environment-specific configurations
- Staging deployment before production
- Rollback capability required

## Security Requirements
- No hardcoded API keys in client-side code
- Secure authentication for admin panel
- HTTPS only
- CSP headers implementation
- Input validation and sanitization

## SEO Requirements
- Canonical URLs for all pages
- Meta descriptions for all pages
- Structured data markup
- Local business schema
- Sitemap generation and updates

## Emergency Protocols
- Critical issues require immediate phone contact display
- Emergency detection in chatbot triggers phone CTA
- 24/7 availability messaging
- Clear escalation paths for urgent issues
