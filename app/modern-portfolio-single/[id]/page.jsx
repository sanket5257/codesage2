import Footer2 from "@/components/footers/Footer2";
import Header8 from "@/components/headers/Header8";
import { modernOnepage } from "@/data/menu";
import { portfolios8 } from "@/data/portfolio";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const portfolio = portfolios8.find((item) => item.id === parseInt(params.id));
  
  if (!portfolio) {
    return {
      title: "Portfolio Not Found || CodeSage",
    };
  }

  return {
    title: `${portfolio.title} || CodeSage &mdash; One & Multi Page React Nextjs Creative Template`,
    description: `${portfolio.title} - CodeSage Portfolio Project`,
  };
}

export default function ModernPortfolioSingle({ params }) {
  const portfolio = portfolios8.find((item) => item.id === parseInt(params.id));

  if (!portfolio) {
    notFound();
  }

  return (
    <>
      <div className="theme-modern">
        <div className="page" id="top">
          <nav className="main-nav transparent stick-fixed wow-menubar">
            <Header8 links={modernOnepage} />
          </nav>
          <main id="main">
            {/* Hero Section */}
            <section className="page-section bg-dark-1 light-content">
              <div className="container position-relative">
                <div className="row">
                  <div className="col-lg-10 offset-lg-1">
                    <h1 className="hs-title-5 font-alt text-center mb-60 mb-sm-40">
                      {portfolio.title}
                    </h1>
                    <div className="row">
                      <div className="col-md-10 offset-md-1 col-lg-8 offset-lg-2">
                        <p className="section-descr-large text-center mb-0">
                          {portfolio.categories}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Portfolio Content */}
            <section className="page-section">
              <div className="container">
                <div className="row">
                  <div className="col-lg-10 offset-lg-1">
                    {/* Main Image */}
                    <div className="mb-80 mb-sm-60">
                      <Image
                        src={portfolio.imageSrc}
                        width={1200}
                        height={782}
                        alt={portfolio.title}
                        className="w-100"
                      />
                    </div>

                    {/* Project Details */}
                    <div className="row mb-80 mb-sm-60">
                      <div className="col-md-6 mb-sm-40">
                        <h3 className="section-title mb-30">Project Overview</h3>
                        <p className="section-descr mb-0">
                          This project showcases our expertise in {portfolio.categories.toLowerCase()}. 
                          We delivered a comprehensive solution that meets the client's requirements 
                          and exceeds their expectations through innovative technology and design.
                        </p>
                      </div>
                      <div className="col-md-6">
                        <h3 className="section-title mb-30">Project Details</h3>
                        <div className="row">
                          <div className="col-sm-6 mb-20">
                            <strong>Category:</strong><br />
                            {portfolio.categories}
                          </div>
                          <div className="col-sm-6 mb-20">
                            <strong>Client:</strong><br />
                            CodeSage Client
                          </div>
                          <div className="col-sm-6 mb-20">
                            <strong>Year:</strong><br />
                            2024
                          </div>
                          <div className="col-sm-6 mb-20">
                            <strong>Status:</strong><br />
                            Completed
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Images */}
                    <div className="row mb-80 mb-sm-60">
                      <div className="col-md-6 mb-sm-30">
                        <Image
                          src={portfolio.imageSrc}
                          width={600}
                          height={400}
                          alt={`${portfolio.title} - Detail 1`}
                          className="w-100"
                        />
                      </div>
                      <div className="col-md-6">
                        <Image
                          src={portfolio.imageSrc}
                          width={600}
                          height={400}
                          alt={`${portfolio.title} - Detail 2`}
                          className="w-100"
                        />
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="row">
                      <div className="col-md-6 mb-sm-30">
                        <Link
                          href="/#portfolio"
                          className="btn btn-mod btn-border btn-medium btn-circle"
                        >
                          ← Back to Portfolio
                        </Link>
                      </div>
                      <div className="col-md-6 text-md-end">
                        <Link
                          href="/#contact"
                          className="btn btn-mod btn-w btn-medium btn-circle"
                        >
                          Start Your Project →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
          <footer className="footer-1 bg-dark-1 light-content">
            <Footer2 />
          </footer>
        </div>
      </div>
    </>
  );
}

// Generate static params for all portfolio items
export async function generateStaticParams() {
  return portfolios8.map((portfolio) => ({
    id: portfolio.id.toString(),
  }));
}