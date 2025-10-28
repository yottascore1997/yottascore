# PowerShell script to fix all case sensitivity issues in Prisma migrations

Write-Host "Fixing case sensitivity issues in all migration files..."

# Get all migration SQL files
$migrationFiles = Get-ChildItem -Path "prisma\migrations" -Filter "*.sql" -Recurse

foreach ($file in $migrationFiles) {
    Write-Host "Processing: $($file.FullName)"
    
    # Read file content
    $content = Get-Content $file.FullName -Raw
    
    # Define table name mappings (lowercase to proper case)
    $tableMappings = @{
        '`user`' = '`User`'
        '`question`' = '`Question`'
        '`exam`' = '`Exam`'
        '`transaction`' = '`Transaction`'
        '`wallet`' = '`Wallet`'
        '`liveexam`' = '`LiveExam`'
        '`battlequiz`' = '`BattleQuiz`'
        '`battlequizquestion`' = '`BattleQuizQuestion`'
        '`_studentexams`' = '`_StudentExams`'
        '`practiceexam`' = '`PracticeExam`'
        '`practiceexamquestion`' = '`PracticeExamQuestion`'
        '`practiceexamparticipant`' = '`PracticeExamParticipant`'
        '`liveexamparticipant`' = '`LiveExamParticipant`'
        '`liveexamwinner`' = '`LiveExamWinner`'
        '`questionoftheday`' = '`QuestionOfTheDay`'
        '`questionofthedayattempt`' = '`QuestionOfTheDayAttempt`'
        '`timetable`' = '`Timetable`'
        '`timetableslot`' = '`TimetableSlot`'
        '`post`' = '`Post`'
        '`follow`' = '`Follow`'
        '`followrequest`' = '`FollowRequest`'
        '`like`' = '`Like`'
        '`comment`' = '`Comment`'
        '`savedpost`' = '`SavedPost`'
        '`postreport`' = '`PostReport`'
        '`usermessagedelete`' = '`UserMessageDelete`'
        '`userblock`' = '`UserBlock`'
        '`directmessage`' = '`DirectMessage`'
        '`messagereaction`' = '`MessageReaction`'
        '`messagerequest`' = '`MessageRequest`'
        '`group`' = '`Group`'
        '`groupmember`' = '`GroupMember`'
        '`grouppost`' = '`GroupPost`'
        '`grouppostlike`' = '`GroupPostLike`'
        '`grouppostcomment`' = '`GroupPostComment`'
        '`groupmessage`' = '`GroupMessage`'
        '`groupevent`' = '`GroupEvent`'
        '`groupeventparticipant`' = '`GroupEventParticipant`'
        '`groupquiz`' = '`GroupQuiz`'
        '`groupquizattempt`' = '`GroupQuizAttempt`'
        '`grouppoll`' = '`GroupPoll`'
        '`grouppollvote`' = '`GroupPollVote`'
        '`battlequizparticipant`' = '`BattleQuizParticipant`'
        '`battlequizwinner`' = '`BattleQuizWinner`'
        '`battlequizmatch`' = '`BattleQuizMatch`'
        '`battlequizleaderboard`' = '`BattleQuizLeaderboard`'
        '`userbattlestats`' = '`UserBattleStats`'
        '`questioncategory`' = '`QuestionCategory`'
        '`questionbankitem`' = '`QuestionBankItem`'
        '`story`' = '`Story`'
        '`storyview`' = '`StoryView`'
        '`storylike`' = '`StoryLike`'
        '`referral`' = '`Referral`'
        '`supportticket`' = '`SupportTicket`'
        '`supportticketreply`' = '`SupportTicketReply`'
        '`supportticketattachment`' = '`SupportTicketAttachment`'
        '`pushnotification`' = '`PushNotification`'
        '`spygame`' = '`SpyGame`'
        '`spygameplayer`' = '`SpyGamePlayer`'
        '`spygameword`' = '`SpyGameWord`'
        '`spygamevote`' = '`SpyGameVote`'
        '`battleroom`' = '`BattleRoom`'
        '`battleplayer`' = '`BattlePlayer`'
        '`battlequestion`' = '`BattleQuestion`'
        '`battleanswer`' = '`BattleAnswer`'
        '`kycdocument`' = '`KYCDocument`'
        '`battlequizamount`' = '`BattleQuizAmount`'
        '`pollvote`' = '`PollVote`'
        '`questionanswer`' = '`QuestionAnswer`'
        '`booklisting`' = '`BookListing`'
        '`booklike`' = '`BookLike`'
        '`bookreview`' = '`BookReview`'
        '`bookwishlist`' = '`BookWishlist`'
        '`bookcart`' = '`BookCart`'
        '`bookreport`' = '`BookReport`'
        '`booktransaction`' = '`BookTransaction`'
        '`booktransactionmessage`' = '`BookTransactionMessage`'
        '`userbookprofile`' = '`UserBookProfile`'
        '`govtexamnotification`' = '`GovtExamNotification`'
    }
    
    # Apply all mappings
    $modified = $false
    foreach ($lowercase in $tableMappings.Keys) {
        $uppercase = $tableMappings[$lowercase]
        if ($content -match [regex]::Escape($lowercase)) {
            $content = $content -replace [regex]::Escape($lowercase), $uppercase
            $modified = $true
        }
    }
    
    # Also fix ON clause references
    foreach ($lowercase in $tableMappings.Keys) {
        $uppercase = $tableMappings[$lowercase]
        $lowercaseNoBackticks = $lowercase -replace '`', ''
        $uppercaseNoBackticks = $uppercase -replace '`', ''
        $pattern = "ON `$lowercaseNoBackticks`"
        $replacement = "ON `$uppercaseNoBackticks`"
        if ($content -match [regex]::Escape($pattern)) {
            $content = $content -replace [regex]::Escape($pattern), $replacement
            $modified = $true
        }
    }
    
    # Write back if modified
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "All migration files have been processed!"
Write-Host "You can now run: npx prisma migrate deploy"

