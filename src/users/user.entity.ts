@Column()
password_hash: string;

@Column({ type: 'text', nullable: true })
verification_token: string | null;

@Column({ type: 'text', nullable: true })
reset_password_token: string | null;

@Column({ type: 'text', nullable: true })
reset_password_expires: string | null;