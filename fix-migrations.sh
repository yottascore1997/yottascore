#!/bin/bash

# Script to fix all case sensitivity issues in Prisma migrations
echo "Fixing case sensitivity issues in all migration files..."

# List of common table name fixes
declare -A table_fixes=(
    ["user"]="User"
    ["question"]="Question"
    ["exam"]="Exam"
    ["transaction"]="Transaction"
    ["wallet"]="Wallet"
    ["liveexam"]="LiveExam"
    ["battlequiz"]="BattleQuiz"
    ["battlequizquestion"]="BattleQuizQuestion"
    ["_studentexams"]="_StudentExams"
    ["practiceexam"]="PracticeExam"
    ["practiceexamquestion"]="PracticeExamQuestion"
    ["practiceexamparticipant"]="PracticeExamParticipant"
    ["liveexamparticipant"]="LiveExamParticipant"
    ["liveexamwinner"]="LiveExamWinner"
    ["questionoftheday"]="QuestionOfTheDay"
    ["questionofthedayattempt"]="QuestionOfTheDayAttempt"
    ["timetable"]="Timetable"
    ["timetableslot"]="TimetableSlot"
    ["post"]="Post"
    ["follow"]="Follow"
    ["followrequest"]="FollowRequest"
    ["like"]="Like"
    ["comment"]="Comment"
    ["savedpost"]="SavedPost"
    ["postreport"]="PostReport"
    ["usermessagedelete"]="UserMessageDelete"
    ["userblock"]="UserBlock"
    ["directmessage"]="DirectMessage"
    ["messagereaction"]="MessageReaction"
    ["messagerequest"]="MessageRequest"
    ["group"]="Group"
    ["groupmember"]="GroupMember"
    ["grouppost"]="GroupPost"
    ["grouppostlike"]="GroupPostLike"
    ["grouppostcomment"]="GroupPostComment"
    ["groupmessage"]="GroupMessage"
    ["groupevent"]="GroupEvent"
    ["groupeventparticipant"]="GroupEventParticipant"
    ["groupquiz"]="GroupQuiz"
    ["groupquizattempt"]="GroupQuizAttempt"
    ["grouppoll"]="GroupPoll"
    ["grouppollvote"]="GroupPollVote"
    ["battlequizparticipant"]="BattleQuizParticipant"
    ["battlequizwinner"]="BattleQuizWinner"
    ["battlequizmatch"]="BattleQuizMatch"
    ["battlequizleaderboard"]="BattleQuizLeaderboard"
    ["userbattlestats"]="UserBattleStats"
    ["questioncategory"]="QuestionCategory"
    ["questionbankitem"]="QuestionBankItem"
    ["story"]="Story"
    ["storyview"]="StoryView"
    ["storylike"]="StoryLike"
    ["referral"]="Referral"
    ["supportticket"]="SupportTicket"
    ["supportticketreply"]="SupportTicketReply"
    ["supportticketattachment"]="SupportTicketAttachment"
    ["pushnotification"]="PushNotification"
    ["spygame"]="SpyGame"
    ["spygameplayer"]="SpyGamePlayer"
    ["spygameword"]="SpyGameWord"
    ["spygamevote"]="SpyGameVote"
    ["battleroom"]="BattleRoom"
    ["battleplayer"]="BattlePlayer"
    ["battlequestion"]="BattleQuestion"
    ["battleanswer"]="BattleAnswer"
    ["kycdocument"]="KYCDocument"
    ["battlequizamount"]="BattleQuizAmount"
    ["pollvote"]="PollVote"
    ["questionanswer"]="QuestionAnswer"
    ["booklisting"]="BookListing"
    ["booklike"]="BookLike"
    ["bookreview"]="BookReview"
    ["bookwishlist"]="BookWishlist"
    ["bookcart"]="BookCart"
    ["bookreport"]="BookReport"
    ["booktransaction"]="BookTransaction"
    ["booktransactionmessage"]="BookTransactionMessage"
    ["userbookprofile"]="UserBookProfile"
)

# Function to fix case sensitivity in a file
fix_migration_file() {
    local file="$1"
    echo "Fixing: $file"
    
    # Create backup
    cp "$file" "$file.backup"
    
    # Apply fixes
    for lowercase in "${!table_fixes[@]}"; do
        uppercase="${table_fixes[$lowercase]}"
        # Replace table names in ALTER TABLE, DROP TABLE, CREATE TABLE statements
        sed -i "s/\`$lowercase\`/\`$uppercase\`/g" "$file"
        sed -i "s/ON \`$lowercase\`/ON \`$uppercase\`/g" "$file"
        sed -i "s/REFERENCES \`$lowercase\`/REFERENCES \`$uppercase\`/g" "$file"
    done
}

# Find all migration SQL files and fix them
find prisma/migrations -name "*.sql" -type f | while read -r file; do
    fix_migration_file "$file"
done

echo "All migration files have been fixed!"
echo "You can now run: npx prisma migrate deploy"

