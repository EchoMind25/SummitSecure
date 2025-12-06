import { faker } from '@faker-js/faker'
import { supabase, isSupabaseAvailable } from './supabase'

// Generate fake data for development
export async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with fake data...')

    // Check if Supabase is available
    if (!isSupabaseAvailable()) {
      console.error('❌ Supabase is not configured. Please check your .env.local file.')
      console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
      return
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase!.auth.getUser()

    if (userError) {
      console.error('❌ Error getting user:', userError.message)
      console.log('💡 Make sure you are logged in. Try running the app first and logging in.')
      return
    }

    if (!user) {
      console.error('❌ No authenticated user found. Please log in first.')
      console.log('💡 Start the app with "npm run dev" and log in, then run the seed script.')
      return
    }

    // Create or get firm
    let { data: firm } = await supabase!
      .from('firms')
      .select('*')
      .eq('name', 'Demo Accounting Firm')
      .single()

    if (!firm) {
      const { data: newFirm, error: firmError } = await supabase!
        .from('firms')
        .insert({
          name: 'Demo Accounting Firm',
          slug: 'demo-accounting-firm'
        })
        .select()
        .single()

      if (firmError) throw firmError
      firm = newFirm
    }

    // Update user with firm_id
    await supabase!
      .from('users')
      .update({ firm_id: firm.id })
      .eq('id', user.id)

    // Create branding settings
    await supabase!
      .from('branding_settings')
      .upsert({
        firm_id: firm.id,
        logo_url: null,
        primary_color: '#2563EB',
        require_client_password: false,
        show_powered_by: true
      })

    // Create fake clients
    const clients = []
    for (let i = 0; i < 8; i++) {
      const clientName = faker.company.name()
      const clientEmail = faker.internet.email()

      const { data: client, error: clientError } = await supabase!
        .from('clients')
        .insert({
          firm_id: firm.id,
          name: clientName,
          email: clientEmail,
          share_id: faker.string.alphanumeric(16)
        })
        .select()
        .single()

      if (clientError) throw clientError
      clients.push(client)
    }

    // Create fake files for each client (ensure some locked files for demo)
    for (const client of clients) {
      const fileCount = faker.number.int({ min: 3, max: 7 }) // Ensure some files
      for (let i = 0; i < fileCount; i++) {
        const fileTypes = ['pdf', 'docx', 'xlsx', 'jpg', 'png']
        const fileType = faker.helpers.arrayElement(fileTypes)
        const originalName = `${faker.lorem.words(2).replace(' ', '_')}.${fileType}`
        const isLocked = i < 2 // First 2 files are locked for demo purposes

        await supabase!
          .from('files')
          .insert({
            client_id: client.id,
            firm_id: firm.id,
            filename: `${faker.string.uuid()}.${fileType}`,
            original_name: originalName,
            file_size: faker.number.int({ min: 1024, max: 10485760 }), // 1KB to 10MB
            mime_type: fileType === 'pdf' ? 'application/pdf' :
                      fileType === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                      fileType === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                      `image/${fileType}`,
            storage_path: `files/${client.id}/${faker.string.uuid()}.${fileType}`,
            uploaded_by: user.id,
            is_locked: isLocked,
            unlocked_at: isLocked ? null : faker.date.recent()
          })
      }
    }

    console.log('✅ Database seeded successfully!')
    console.log(`Created ${clients.length} fake clients with associated files`)

  } catch (error) {
    console.error('❌ Error seeding database:', error)
  }
}

// Function to clear all fake data
export async function clearFakeData() {
  try {
    console.log('🧹 Clearing fake data...')

    // Check if Supabase is available
    if (!isSupabaseAvailable()) {
      console.error('❌ Supabase is not configured. Please check your .env.local file.')
      console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
      return
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase!.auth.getUser()

    if (userError) {
      console.error('❌ Error getting user:', userError.message)
      return
    }

    if (!user) {
      console.error('❌ No authenticated user found. Please log in first.')
      return
    }

    // Get user's firm
    const { data: firm } = await supabase!
      .from('users')
      .select('firm_id')
      .eq('id', user.id)
      .single()

    if (!firm?.firm_id) return

    // Delete in correct order (respecting foreign keys)
    await supabase!.from('audit_log').delete().eq('firm_id', firm.firm_id)
    await supabase!.from('files').delete().eq('firm_id', firm.firm_id)
    await supabase!.from('clients').delete().eq('firm_id', firm.firm_id)
    await supabase!.from('branding_settings').delete().eq('firm_id', firm.firm_id)
    await supabase!.from('users').update({ firm_id: null }).eq('firm_id', firm.firm_id)
    await supabase!.from('firms').delete().eq('id', firm.firm_id)

    console.log('✅ Fake data cleared successfully!')

  } catch (error) {
    console.error('❌ Error clearing fake data:', error)
  }
}
