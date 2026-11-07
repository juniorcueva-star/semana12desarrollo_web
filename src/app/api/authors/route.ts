import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const authors = await prisma.author.findMany({
      include: { books: true, _count: { select: { books: true } } },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(authors)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al obtener autores" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, bio, nationality, birthYear } = await request.json()
    if (!name || !email) {
      return NextResponse.json({ error: "Nombre y email son requeridos" }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }
    const author = await prisma.author.create({
      data: { name, email, bio, nationality, birthYear: birthYear ? Number(birthYear) : null },
      include: { books: true },
    })
    return NextResponse.json(author, { status: 201 })
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })
    }
    console.error(error)
    return NextResponse.json({ error: "Error al crear autor" }, { status: 500 })
  }
}
