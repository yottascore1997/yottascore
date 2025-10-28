# PowerShell script to resolve all failed migrations at once

Write-Host "Resolving all failed migrations..."

# List of all migrations that might be failed
$migrations = @(
    "20250612092143_add_student_fields",
    "20250612124346_remove_question_exam_relation", 
    "20250612182144_add_battle_quiz_mcq",
    "20250613073021_add_live_exams",
    "20250613074025_add_phone_number",
    "20250613084352_update_live_exam_model",
    "20250614071035_add_end_time_to_live_exam",
    "20250614113613_add_winnings_distributed_to_live_exam",
    "20250614131253_add_practice_exam",
    "20250614133122_add_category_to_practice_exam",
    "20250614190214_add_govt_exam_notifications",
    "20250616183602_add_question_of_the_day",
    "20250616202909_add_timetable",
    "20250619171825_add_social_features",
    "20250619183725_add_complete_social_features",
    "20250620205642_add_direct_messages",
    "20250624015102_add_instructions_to_practice_exam",
    "20250624045534_add_marks_to_practice_exam_question",
    "20250625071818_add_battle_quiz_models",
    "20250625074943_add_question_bank_system",
    "20250625085221_add_battle_quiz_models",
    "20250625113541_remove_unique_constraint_battle_quiz_participant",
    "20250627090509_add_message_requests",
    "20250628061012_add_stories",
    "20250628065133_add_story_likes",
    "20250628182503_add_instructions_to_live_exam",
    "20250628194006_add_category_to_live_exam",
    "20250628223015_add_referral_system",
    "20250629132700_add_image_url_to_live_exam",
    "20250702195610_add_support_ticket_system",
    "20250705173621_enhance_battle_quiz_system",
    "20250705182155_add_battle_quiz_status",
    "20250803024519_add_spy_game_models",
    "20250807004307_add_battle_room_system",
    "20250812193238_add_kyc_system",
    "20250812194815_update_kyc_document_image_to_text",
    "20250813204405_add_battle_quiz_amounts",
    "20250826110534_add_question_type",
    "20250902114017_add_username_to_user"
)

foreach ($migration in $migrations) {
    Write-Host "Resolving migration: $migration"
    try {
        npx prisma migrate resolve --applied $migration
        Write-Host "✅ Resolved: $migration"
    } catch {
        Write-Host "❌ Failed to resolve: $migration"
    }
}

Write-Host "All migrations resolved! Now trying to deploy..."
npx prisma migrate deploy

