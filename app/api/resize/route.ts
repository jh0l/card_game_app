// api for accepting an image
// resizing the image using sharp
// returning the image to be used by the ImageHandler component
import { writeFile } from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const data = await req.formData()
  const fields = {
    width: data.get('width'),
    height: data.get('height'),
  }
  const file = data.get('file') as unknown as File
  if (!(fields.width && typeof fields.width === 'string') || !(fields.height && typeof fields.height === 'string')) {
    return NextResponse.json({ error: 'Width and height are required' }, { status: 400 })
  }
  if (!file) {
    NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // With the file data in the buffer, you can do whatever you want with it.
  // For this, we'll just write it to the filesystem in a new location
  const path = `/tmp/${file.name}`
  await writeFile(path, buffer)
  const { width, height } = fields
  const image = sharp(path)
  if (width && height) {
    image.resize(parseInt(width as string), parseInt(height as string))
  }
  const newBuffer = await image.toBuffer()
  // res.setHeader('Content-Type', 'image/png')
  // res.setHeader('Content-Length', newBuffer.length)
  return new NextResponse(newBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(newBuffer.length),
    },
  })
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    headers: {
      // allow same origin only
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
