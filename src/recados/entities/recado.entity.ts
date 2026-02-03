import { Pessoa } from "src/pessoas/entities/pessoa.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Recado {
  @PrimaryGeneratedColumn()
  id: number; 

  @Column({type: 'varchar', length: 255})
  texto: string;

  // Muitos recados podem ser enviados por uma única pessoa (emissor)
  @ManyToOne(() => Pessoa, {onDelete: 'CASCADE', onUpdate: 'CASCADE'})
  // Especifica a coluna que armazena o id da pessoa que enviou o recado
  @JoinColumn({ name: 'de' })
  de: Pessoa;
  
  // Muitos recados podem ser enviados para uma única pessoa (destinatário)
  @ManyToOne(() => Pessoa, {onDelete: 'CASCADE', onUpdate: 'CASCADE'})
  // Especifica a coluna que armazena o id da pessoa que recebe o recado
  @JoinColumn({ name: 'para' })
  para: Pessoa;
  
  @Column({default: false})
  lido: boolean;

  @Column()
  data: Date; // created at

  @CreateDateColumn()
  createdAt?: Date; // created at

  @UpdateDateColumn()
  updatedAt?: Date; // updated at
}
