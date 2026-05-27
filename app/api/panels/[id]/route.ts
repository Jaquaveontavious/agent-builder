import { createAuthClient, createServiceClient } from '@/lib/supabase/server'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const service = createServiceClient()
  const { error } = await service.from('panels').delete().eq('id', id).eq('user_id', user.id)

  if (error) return new Response('Failed to delete panel.', { status: 500 })
  return new Response(null, { status: 204 })
}
