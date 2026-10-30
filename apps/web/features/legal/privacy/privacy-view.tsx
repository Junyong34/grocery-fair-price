import { PRIVACY_CHANGES, PRIVACY_INTRO, PRIVACY_SECTIONS } from "./privacy-content"

const LINK = /(https?:\/\/\S+|[\w.+-]+@[\w-]+\.[\w.]+)/

/** 문장 안의 주소 · 이메일을 링크로 바꾼다. */
function Linked({ text }: { text: string }) {
  return text.split(LINK).map((part, index) =>
    index % 2 === 1 ? (
      <a key={index} href={part.includes("@") ? `mailto:${part}` : part} className="break-all text-ink underline underline-offset-4" target={part.includes("@") ? undefined : "_blank"} rel="noreferrer">
        {part}
      </a>
    ) : (
      part
    ),
  )
}

/** 개인정보 처리방침(/privacy). 본문은 privacy-content.ts에 있다. */
export function PrivacyView() {
  const [current] = PRIVACY_CHANGES
  return (
    <article className="mx-auto flex max-w-[680px] flex-col gap-8 px-[18px] pt-6 pb-12 lg:px-6 lg:pt-10">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-2xl font-bold text-ink lg:text-3xl">개인정보 처리방침</h1>
        <p className="text-[15px] leading-relaxed text-ink">{PRIVACY_INTRO}</p>
        {current && <p className="text-[13px] text-stone">시행일 {current.date}</p>}
      </header>
      {PRIVACY_SECTIONS.map((section) => (
        <section key={section.title} className="flex flex-col gap-2.5">
          <h2 className="font-heading text-lg font-bold text-ink">{section.title}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="text-[15px] leading-relaxed text-ink">
              <Linked text={paragraph} />
            </p>
          ))}
          {section.items && (
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed text-ink marker:text-caption">
              {section.items.map((item) => (
                <li key={item}>
                  <Linked text={item} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
      <section className="flex flex-col gap-2.5 border-t border-hairline pt-6">
        <h2 className="font-heading text-lg font-bold text-ink">바뀐 내역</h2>
        <ul className="flex flex-col gap-1 text-[13px] text-stone tabular-nums">
          {PRIVACY_CHANGES.map((change) => (
            <li key={change.date}>
              {change.date} · {change.note}
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
}
