"use client"

export function LetterCard() {
  return (
    <article className="max-w-2xl mx-auto">
      {/* Conteúdo da carta */}
      <div className="text-foreground/90 leading-loose space-y-8">
        <p className="text-lg md:text-xl leading-relaxed first-letter:text-5xl first-letter:font-bold first-letter:mr-2 first-letter:float-left first-letter:leading-none first-letter:text-foreground">
          A coisa mais triste para um homem não é a falta de dinheiro, nem as dificuldades da vida — é sentir falta de atenção, respeito, desejo, admiração, amor, carinho, compreensão e parceria dentro do próprio relacionamento.
        </p>

        <div className="space-y-4 text-foreground/80">
          <p>Peço algo… parece que estou exigindo demais.</p>
          <p>Demonstro carinho… e sou mal interpretado.</p>
          <p>O silêncio vira castigo. A distância vira rotina. E, aos poucos, eu vou me sentindo sozinho… mesmo estando acompanhado.</p>
        </div>

        <blockquote className="border-l border-border pl-6 py-4 my-12">
          <p className="italic text-foreground/70 leading-relaxed">
            Eu tentei.
            <br />
            Trabalhei, me esforcei, me desgastei tentando agradar, tentando melhorar, tentando salvar o que construímos.
            <br />
            Mas chegou um ponto em que parecia que só eu lutava.
            <br />
            E quando só um sustenta, o relacionamento deixa de ser parceria… e vira peso.
          </p>
        </blockquote>

        <p className="text-foreground/80">
          E quando eu dizia que não aguentava mais…
          <br />
          vinham promessas, lágrimas, pedidos de mudança — mas, pouco tempo depois, tudo voltava a ser como antes.
        </p>

        <div className="space-y-2 text-foreground/60 my-12">
          <p>Já tentei orar.</p>
          <p>Já tentei amar mais.</p>
          <p>Já tentei esperar.</p>
          <p>Já tentei conversar.</p>
          <p className="text-foreground font-medium pt-2">
            Mas relacionamento não se constrói sozinho.
          </p>
        </div>

        <p className="text-foreground/80">
          É difícil continuar quando você sente que está dando tudo… e recebendo quase nada.
          Quando seu esforço não é visto, seu cansaço não é entendido, e sua presença deixa de ser valorizada.
        </p>

        <p className="text-foreground font-medium">
          Toda relação precisa de reciprocidade, respeito e vontade dos dois lados. Sem isso, o que era amor começa a virar desgaste.
        </p>

        <div className="my-16 py-8 border-t border-b border-border">
          <p className="text-foreground text-lg">
            Se tem algo que aprendi com tudo isso, é que ninguém deveria precisar implorar por amor, atenção ou respeito.
          </p>
          <p className="mt-6 text-foreground/70">
            Relacionamento saudável não é perfeito — mas é construído por dois, com esforço, cuidado e verdade.
          </p>
        </div>

        <div className="mt-16 pt-8">
          <p className="text-lg text-foreground">
            Então, por mais difícil que seja:
            <br />
            <span className="font-semibold">não se perca tentando salvar algo sozinho.</span>
          </p>
          <p className="mt-8 text-xl font-medium text-foreground/90">
            Porque amor de verdade não esgota — ele fortalece.
          </p>
        </div>

        {/* Assinatura */}
        <footer className="mt-16 pt-8 border-t border-border">
          <p className="text-right">
            <span className="text-foreground/60 text-sm">Com verdade,</span>
            <br />
            <span className="font-serif italic text-2xl text-foreground mt-2 block">Thierry</span>
          </p>
        </footer>
      </div>
    </article>
  )
}