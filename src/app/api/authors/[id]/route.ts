import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Context = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Context) {
  try {
    const { id } = await params
    const author = await prisma.author.findUnique({
      where: { id },
      include: { books: { orderBy: { publishedYear: "desc" } }, _count: { select: { books: true } } },
    })
    if (!author) return NextResponse.json({ error: "Autor no encontrado" }, { status: 404 })
    return NextResponse.json(author)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al obtener autor" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: Context) {
  try {
    const { id } = await params
    const { name, email, bio, nationality, birthYear } = await request.json()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }
    const author = await prisma.author.update({
      where: { id },
      data: {
        name,
        email,
        bio,
        nationality,
        birthYear: birthYear === undefined ? undefined : birthYear ? Number(birthYear) : null,
      },
      include: { books: true },
    })
    return NextResponse.json(author)
  } catch (error: unknown) {
    const code = (error as { code?: string }).code
    if (code === "P2025") return NextResponse.json({ error: "Autor no encontrado" }, { status: 404 })
    if (code === "P2002") return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })
    console.error(error)
    return NextResponse.json({ error: "Error al actualizar autor" }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: Context) {
  try {
    const { id } = await params
    await prisma.author.delete({ where: { id } })
    return NextResponse.json({ message: "Autor eliminado correctamente" })
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Autor no encontrado" }, { status: 404 })
    }
    console.error(error)
    return NextResponse.json({ error: "Error al eliminar autor" }, { status: 500 })
  }
}
