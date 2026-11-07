import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const sortFields = ["title", "publishedYear", "createdAt"] as const

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.trim()
    const genre = searchParams.get("genre")?.trim()
    const authorName = searchParams.get("authorName")?.trim()
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1)
    const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get("limit") ?? "10", 10) || 10))
    const requestedSort = searchParams.get("sortBy")
    const sortBy = sortFields.includes(requestedSort as (typeof sortFields)[number])
      ? (requestedSort as (typeof sortFields)[number])
      : "createdAt"
    const order = searchParams.get("order") === "asc" ? "asc" : "desc"

    const where = {
      ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
      ...(genre ? { genre } : {}),
      ...(authorName
        ? { author: { name: { contains: authorName, mode: "insensitive" as const } } }
        : {}),
    }

    const [data, total] = await prisma.$transaction([
      prisma.book.findMany({
        where,
        include: { author: { select: { id: true, name: true, nationality: true } } },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.book.count({ where }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))
    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al buscar libros" }, { status: 500 })
  }
}
