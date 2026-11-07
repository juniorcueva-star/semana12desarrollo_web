import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Context = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Context) {
  try {
    const { id } = await params
    const book = await prisma.book.findUnique({ where: { id }, include: { author: true } })
    if (!book) return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 })
    return NextResponse.json(book)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al obtener libro" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: Context) {
  try {
    const { id } = await params
    const { title, description, isbn, publishedYear, genre, pages, authorId } = await request.json()
    if (title && title.length < 3) return NextResponse.json({ error: "El título debe tener al menos 3 caracteres" }, { status: 400 })
    if (pages && Number(pages) < 1) return NextResponse.json({ error: "El número de páginas debe ser mayor a 0" }, { status: 400 })
    if (authorId && !(await prisma.author.findUnique({ where: { id: authorId } }))) {
      return NextResponse.json({ error: "El autor especificado no existe" }, { status: 404 })
    }
    const book = await prisma.book.update({
      where: { id },
      data: { title, description, isbn, publishedYear: publishedYear ? Number(publishedYear) : undefined, genre, pages: pages ? Number(pages) : undefined, authorId },
      include: { author: true },
    })
    return NextResponse.json(book)
  } catch (error: unknown) {
    const code = (error as { code?: string }).code
    if (code === "P2025") return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 })
    if (code === "P2002") return NextResponse.json({ error: "El ISBN ya existe" }, { status: 409 })
    console.error(error)
    return NextResponse.json({ error: "Error al actualizar libro" }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: Context) {
  try {
    const { id } = await params
    await prisma.book.delete({ where: { id } })
    return NextResponse.json({ message: "Libro eliminado correctamente" })
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2025") return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 })
    console.error(error)
    return NextResponse.json({ error: "Error al eliminar libro" }, { status: 500 })
  }
}
