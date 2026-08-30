"use client";

import { motion } from "motion/react";
import type { Project } from "@/data/site";

function ProofLine({ project }: { project: Project }) {
  return (
    <div className="story-proof-line">
      {project.proof.map((item, index) => (
        <motion.div
          key={item}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ delay: index * .045 }}
        >
          <span>{String(index + 1).padStart(2, "0")}</span>
          <b>{item}</b>
        </motion.div>
      ))}
    </div>
  );
}

function FoundryStory({ project }: { project: Project }) {
  return (
    <section className="portal-story story-foundry">
      <div className="story-foundry-lead">
        <span>WHY IT EXISTS</span>
        <p>{project.problem}</p>
        <blockquote>{project.principle}</blockquote>
      </div>
      <div className="story-foundry-rules">
        <article><span>NON-NEGOTIABLE</span><p>{project.constraint}</p></article>
        <article><span>THE APPROACH</span><p>{project.decision}</p></article>
      </div>
      <div className="story-loop" aria-label="Foundry180 architecture">
        {project.architecture.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><b>{item}</b></div>)}
      </div>
      <ProofLine project={project} />
      <div className="story-next"><span>NEXT MILESTONE</span><p>{project.next}</p></div>
    </section>
  );
}

function PortfolioStory({ project }: { project: Project }) {
  return (
    <section className="portal-story story-portfolio">
      <div className="story-portfolio-tension">
        <span>THE TENSION</span>
        <h3>{project.problem}</h3>
        <p>{project.constraint}</p>
      </div>
      <div className="story-portfolio-rule">
        <span>THE RULE</span>
        <blockquote>{project.principle}</blockquote>
        <p>{project.decision}</p>
      </div>
      <div className="story-portfolio-proof">
        <span>WHAT IS ACTUALLY HERE</span>
        <ProofLine project={project} />
      </div>
      <div className="story-next"><span>SHIP LINE</span><p>{project.next}</p></div>
    </section>
  );
}

function ZeroUploadStory({ project }: { project: Project }) {
  return (
    <section className="portal-story story-zero">
      <div className="story-zero-manifesto"><span>BOUNDARY FIRST</span><h3>{project.principle}</h3></div>
      <div className="story-zero-path">
        <article><span>01 / PRESSURE</span><p>{project.problem}</p></article>
        <article><span>02 / LIMIT</span><p>{project.constraint}</p></article>
        <article><span>03 / CHOICE</span><p>{project.decision}</p></article>
      </div>
      <div className="story-zero-materials">
        <span>THE SMALLER STACK</span>
        <div>{project.architecture.map((item) => <b key={item}>{item}</b>)}</div>
      </div>
      <ProofLine project={project} />
      <div className="story-next"><span>WHERE IT STOPS FOR NOW</span><p>{project.next}</p></div>
    </section>
  );
}

function WindowBiomeStory({ project }: { project: Project }) {
  return (
    <section className="portal-story story-biome">
      <div className="story-biome-rule"><span>BEHAVIOR, NOT ANOTHER PANEL</span><blockquote>{project.principle}</blockquote></div>
      <div className="story-biome-stack">
        <div><span>OBSERVE</span><p>{project.problem}</p></div>
        <div><span>STAY OUT OF THE WAY</span><p>{project.constraint}</p></div>
        <div><span>REACT</span><p>{project.decision}</p></div>
      </div>
      <div className="story-biome-sequence" aria-label="WindowBiome architecture">
        {project.architecture.map((item, index) => <div key={item}><i /><span>{String(index + 1).padStart(2, "0")}</span><b>{item}</b></div>)}
      </div>
      <ProofLine project={project} />
      <div className="story-next"><span>NEXT BEHAVIOR</span><p>{project.next}</p></div>
    </section>
  );
}

function NovaStory({ project }: { project: Project }) {
  return (
    <section className="portal-story story-nova">
      <div className="story-nova-title"><span>A STUDY, NOT A CLAIM</span><h3>Visual craft was the subject.</h3><p>{project.problem}</p></div>
      <blockquote className="story-nova-quote">{project.principle}</blockquote>
      <div className="story-nova-notes">
        <article><span>THE LIMIT</span><p>{project.constraint}</p></article>
        <article><span>THE DECISION</span><p>{project.decision}</p></article>
        <article><span>WHY IT STAYS</span><p>{project.next}</p></article>
      </div>
      <div className="story-nova-materials">{project.architecture.map((item) => <span key={item}>{item}</span>)}</div>
      <ProofLine project={project} />
    </section>
  );
}

export default function ProjectStory({ project }: { project: Project }) {
  if (project.id === "foundry180") return <FoundryStory project={project} />;
  if (project.id === "aura-system") return <PortfolioStory project={project} />;
  if (project.id === "zeroupload") return <ZeroUploadStory project={project} />;
  if (project.id === "windowbiome") return <WindowBiomeStory project={project} />;
  return <NovaStory project={project} />;
}
