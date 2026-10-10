import { BadgeCheck, ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CalculatorFallback } from "@/components/landing/calculator/calculator";
import { EmiCalculator } from "@/components/landing/calculator/emi-calculator";
import { EnquiryProvider } from "@/components/landing/enquiry";
import { MobileActionBar } from "@/components/landing/mobile-action-bar";
import { ProjectCarousel } from "@/components/landing/project-carousel";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { EnquiryCard } from "@/components/project/enquiry-card";
import { KeyFacts } from "@/components/project/key-facts";
import { ProjectFaqs, projectFaqs } from "@/components/project/project-faqs";
import { ProjectGallery } from "@/components/project/project-gallery";
import {
  Amenities,
  Disclaimer,
  Location,
  Overview,
  ProjectSection,
  Rera,
  Towers,
} from "@/components/project/project-sections";
import { SectionNav } from "@/components/project/section-nav";
import { site } from "@/config/site";
import { localityName } from "@/data/localities";
import { SAMPLE_DATA } from "@/data/project-details";
import { projectPhotos } from "@/data/sample-photos";
import { projects } from "@/data/projects";
import { formatPriceRange, formatRange } from "@/lib/format";
import { findProject, projectDetail, projectHref, similarProjects } from "@/lib/project-url";

export function generateStaticParams() {
  return projects.map((project) => ({ locality: project.locality, project: project.id }));
}

async function load(params) {
  const { locality, project: slug } = await params;
  const project = findProject(locality, slug);
  if (!project) notFound();
  return { project, detail: projectDetail(project) };
}

export async function generateMetadata({ params }) {
  const { project, detail } = await load(params);
  const area = localityName(project.locality);
  const title = `${project.name}, ${area} | ${formatRange(project.bhk, "BHK")} from ${formatPriceRange(project.priceMin, project.priceMax)}`;
  const description =
    detail.description ??
    `${project.name} by ${project.developer} in ${area}, Ahmedabad: ${formatRange(project.bhk, "BHK")} homes, RERA registered.`;
  return {
    title,
    description,
    alternates: { canonical: projectHref(project) },
    openGraph: { type: "website", locale: "en_IN", url: projectHref(project), siteName: site.name, title, description },
    // Sample projects carry RERA badges for projects that don't exist: keep them out of search.
    robots: SAMPLE_DATA ? { index: false, follow: false } : undefined,
  };
}

function jsonLd(value) {
  return { __html: JSON.stringify(value).replace(/</g, "\\u003c") };
}

// The shell (header, footer) renders at once; everything about the project
// reads params, so it streams inside a Suspense boundary. Known projects are
// prerendered, so visitors get the full page straight away.
export default function ProjectPage({ params }) {
  return (
    <EnquiryProvider>
      <SiteHeader />
      <Suspense fallback={<ProjectSkeleton />}>
        <ProjectContent params={params} />
      </Suspense>
      <SiteFooter />
    </EnquiryProvider>
  );
}

// Same footprint as the top of the page, so nothing shifts when it streams in.
function ProjectSkeleton() {
  return (
    <main id="main" aria-busy="true" className="flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 pb-28 sm:px-6 md:pb-20">
        <div className="h-4 w-64 max-w-full pt-6 pb-4" />
        <div className="mt-10 aspect-[16/10] rounded-2xl bg-muted lg:aspect-[2/1]" />
        <div className="mt-2 h-[3.5rem] sm:h-[4.25rem]" />
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <div className="h-3 w-40 rounded bg-muted" />
            <div className="mt-4 h-12 w-3/4 rounded bg-muted" />
            <div className="mt-6 h-44 rounded-2xl bg-muted/60" />
          </div>
          <div className="hidden h-64 rounded-2xl bg-muted/60 lg:block" />
        </div>
      </div>
    </main>
  );
}

async function ProjectContent({ params }) {
  const { project, detail } = await load(params);
  const area = localityName(project.locality);
  const url = `${site.url}${projectHref(project)}`;
  const topic = `${project.name}, ${area}`;
  const message = `Hi ${site.name}, I'd like to know more about ${project.name} in ${area} (${formatPriceRange(project.priceMin, project.priceMax)}).`;
  const faqs = projectFaqs(project, detail);

  const sections = [
    { id: "overview", label: "Overview", show: detail.description || detail.highlights?.length },
    { id: "towers", label: "Towers", show: detail.towers?.length },
    { id: "amenities", label: "Amenities", show: detail.amenities?.length },
    { id: "location", label: "Location", show: detail.address },
    { id: "rera", label: "RERA", show: true },
    { id: "emi", label: "EMI", show: true },
    { id: "faqs", label: "FAQs", show: true },
  ]
    .filter((section) => section.show)
    .map(({ id, label }) => ({ id, label }));

  const listing = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: project.name,
    url,
    description: detail.description,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: project.priceMin,
      highPrice: project.priceMax,
    },
    about: {
      "@type": "Residence",
      name: project.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: detail.address,
        addressLocality: area,
        addressRegion: "Gujarat",
        addressCountry: "IN",
      },
    },
  };
  const breadcrumbs = [
    { name: "Home", url: site.url },
    { name: "Ahmedabad", url: `${site.url}/#projects` },
    { name: area, url: `${site.url}/?area=${project.locality}#projects` },
    { name: project.name, url },
  ];
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(listing)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqLd)} />
      {/* --project-sticky: header (4rem) + section nav (3rem). Section scroll
          margins use it; globals.css drops the page-wide scroll padding here. */}
      <main id="main" data-project-page className="flex-1 [--project-sticky:7rem]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-28 sm:px-6 md:pb-20">
          <nav aria-label="Breadcrumb" className="pt-6 pb-4">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <li><Link href="/" className="rounded hover:text-foreground">Home</Link></li>
              <li aria-hidden="true"><ChevronRight className="size-3" /></li>
              <li><Link href="/#projects" className="rounded hover:text-foreground">Ahmedabad</Link></li>
              <li aria-hidden="true"><ChevronRight className="size-3" /></li>
              <li><Link href={`/?area=${project.locality}#projects`} className="rounded hover:text-foreground">{area}</Link></li>
              <li aria-hidden="true"><ChevronRight className="size-3" /></li>
              <li aria-current="page" className="text-foreground">{project.name}</li>
            </ol>
          </nav>

          <ProjectGallery project={project} photos={projectPhotos(project, detail)} sample={SAMPLE_DATA} />

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0">
              <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                {area} · {project.developer}
              </p>
              <h1 className="mt-3 font-display text-title font-normal text-balance">{project.name}</h1>
              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full border border-border px-2.5 py-1 font-medium">
                  {project.status === "ready" ? "Ready to move" : `Possession ${project.possession}`}
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <BadgeCheck className="size-4 text-success" aria-hidden="true" />
                  RERA registered
                </span>
              </p>
              <div className="mt-6">
                <KeyFacts project={project} detail={detail} />
              </div>

              {/* A direct child of this column, so it stays stuck through every section. */}
              <SectionNav sections={sections} className="mt-8" />

              <div className="grid gap-8">
                {sections.some((section) => section.id === "overview") ? (
                  <ProjectSection id="overview" title={`About ${project.name}`}>
                    <Overview detail={detail} />
                  </ProjectSection>
                ) : null}
                {detail.towers?.length ? (
                  <ProjectSection id="towers" title="Towers">
                    <Towers towers={detail.towers} projectName={project.name} />
                  </ProjectSection>
                ) : null}
                {detail.amenities?.length ? (
                  <ProjectSection id="amenities" title="Amenities">
                    <Amenities amenities={detail.amenities} />
                  </ProjectSection>
                ) : null}
                {detail.address ? (
                  <ProjectSection id="location" title="Location and nearby">
                    <Location detail={detail} />
                  </ProjectSection>
                ) : null}
                <ProjectSection id="rera" title="RERA details">
                  <Rera project={project} detail={detail} />
                </ProjectSection>
                <ProjectSection id="emi" title="Plan your EMI">
                  {/* Reads loan settings from the URL, so it needs its own boundary. */}
                  <Suspense fallback={<CalculatorFallback />}>
                    <EmiCalculator defaultPrice={project.priceMin} />
                  </Suspense>
                </ProjectSection>
                <ProjectSection id="faqs" title={`Questions about ${project.name}`}>
                  <ProjectFaqs faqs={faqs} />
                </ProjectSection>
              </div>
            </div>

            <div>
              <EnquiryCard project={project} topic={topic} message={message} />
            </div>
          </div>

          <section aria-labelledby="similar-title" className="mt-16 border-t border-border pt-10">
            <h2 id="similar-title" className="mb-6 font-display text-heading font-normal">
              Similar projects
            </h2>
            <ProjectCarousel projects={similarProjects(project, 3)} />
          </section>

          <div className="mt-12">
            <Disclaimer />
          </div>
        </div>
      </main>
      <MobileActionBar topic={topic} message={message} />
    </>
  );
}
