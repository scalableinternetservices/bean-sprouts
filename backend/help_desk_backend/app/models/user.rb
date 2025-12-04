class User < ApplicationRecord
    # apparently this is Rails standard -- it adds password encryption
    # validates password on creating a new user or updating password
    has_secure_password

    # initial associations
        # relationships between database tables
        # enable efficient navigation between related data
    has_many    :conversations_as_initiator,            # name the relationship using Ruby convention
                class_name: 'Conversation',             # designate where it points to
                foreign_key: 'initiator_id',            # designate the column
                dependent:  :destroy
    has_many    :conversations_as_expert,
                class_name: 'Conversation',
                foreign_key: 'assigned_expert_id',
                dependent: :nullify
    has_many    :messages, foreign_key: 'sender_id', dependent: :destroy
    has_one     :expert_profile, dependent: :destroy

    # validations
        # check if data meets requirements before allowing it into the database
        # ex. if we're initializing a new User called "user"
            # with user = User.new(...),
            # user.save method will return false if validations fail, (and the database is untouched)
            # and error messages can be viewed in user.errors.full_messages
    validates   :username,
                presence: true, # username cannot be blank or nil; must have a value
                uniqueness: {
                    case_sensitive: false,
                    message: "this username already exists"
                },  # users cannot have the same username, regardless of case
                length: {
                    minimum: 3,
                    maximum: 50,
                    too_short: "must be at least 3 characters",
                    too_long: "must be at most 50 characters"
                }     # username must be at least 3 characters and at most 50 characters
    
    validates   :password,
                length: {
                    minimum: 6,
                    message: "must be at least 6 characters long"
                },
                if: -> { new_record? || !password.nil? }    # validate password length only when creating a new user 
                                                            # or user is providing a password (including updates)

    # callbacks
    before_save :downcase_username
    # after_create :auto_expert_profile         # commenting out -- occurs on register, not user create

    # # instance methods
    # def auto_expert_profile                   # commenting out -- occurs on register, not user create
    #     create_expert_profile!(bio: "", knowledge_base_links: []) unless expert_profile
    # end

    def update_last_active!     # exclamation mark is bang operator -- convention that indicates a "dangerous method" 
                                # that modifies the object it's called on
        # update(last_active_at: Time.current)
        touch(:last_active_at)
    end

    def expert?
        expert_profile.present?
    end

    private

    def downcase_username
        self.username = username.downcase.strip
    end

end
