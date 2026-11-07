import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_: Request, { params }: RouteContext<"/api/authors/[id]/stats">) {
  try {
    const { id } = await params
    const author = await prisma.author.findUnique({
      where: { id },
      include: { books: { orderBy: { publishedYear: "asc" } } },
    })

    if (!author) return NextResponse.json({ error: "Autor no encontrado" }, { status: 404 })

    const books = author.books
    const withYear = books.filter((book) => book.publishedYear !== null)
    const withPages = books.filter((book) => book.pages !== null)
    const byPages = [...withPages].sort((a, b) => (a.pages ?? 0) - (b.pages ?? 0))

    return NextResponse.json({
      authorId: author.id,
      authorName: author.name,
      totalBooks: books.length,
      firstBook: withYear[0]
        ? { title: withYear[0].title, year: withYear[0].publishedYear }
        : null,
      latestBook: withYear.at(-1)
        ? { title: withYear.at(-1)?.title, year: withYear.at(-1)?.publishedYear }
        : null,
      averagePages: withPages.length
        ? Math.round(withPages.reduce((sum, book) => sum + (book.pages ?? 0), 0) / withPages.length)
        : null,
      genres: [...new Set(books.map((book) => book.genre).filter(Boolean))],
      longestBook: byPages.at(-1) ? { title: byPages.at(-1)?.title, pages: byPages.at(-1)?.pages } : null,
      shortestBook: byPages[0] ? { title: byPages[0].title, pages: byPages[0].pages } : null,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al obtener estadísticas del autor" }, { status: 500 })
  }
}
